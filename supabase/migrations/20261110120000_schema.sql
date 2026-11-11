-- Estrutura do banco (docs/arquitetura.md, seção 6).
-- Código e tabelas em inglês; valores vistos pela Carla em português.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.delivery_kind as enum ('digital', 'fisica');
create type public.option_kind as enum ('technique', 'size', 'finish', 'file_format');
create type public.artwork_status as enum ('rascunho', 'publicada', 'arquivada');
create type public.order_status as enum (
  'nova',
  'em_analise',
  'orcamento_enviado',
  'aguardando_aprovacao',
  'aprovado',
  'em_producao',
  'concluido',
  'cancelado'
);
create type public.email_status as enum ('pendente', 'enviado', 'falhou');
create type public.order_event_type as enum ('criado', 'status', 'nota', 'email_enviado', 'email_falhou');

-- ---------------------------------------------------------------------------
-- Funções de apoio
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Foto guardada em JSON (categorias, modalidades, configurações):
-- { path, alt, width, height, focalX, focalY }.
create function public.is_image_asset(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  -- coalesce: campo ausente daria null, e null passa em um check.
  select value is null or coalesce(
    jsonb_typeof(value) = 'object'
    and jsonb_typeof(value -> 'path') = 'string'
    and jsonb_typeof(value -> 'alt') = 'string'
    and jsonb_typeof(value -> 'width') = 'number'
    and jsonb_typeof(value -> 'height') = 'number'
    and jsonb_typeof(value -> 'focalX') = 'number'
    and jsonb_typeof(value -> 'focalY') = 'number'
    and length(trim(value ->> 'alt')) > 0
    and (value ->> 'width')::numeric > 0
    and (value ->> 'height')::numeric > 0
    and (value ->> 'focalX')::numeric between 0 and 100
    and (value ->> 'focalY')::numeric between 0 and 100,
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

create table public.modalities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  image jsonb check (public.is_image_asset(image)),
  delivery_kind public.delivery_kind not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  tagline text not null default '',
  image jsonb not null check (public.is_image_asset(image)),
  sort_order integer not null default 0,
  active boolean not null default true,
  show_on_home boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quais categorias aparecem como "tipo de arte" em cada modalidade.
create table public.category_modalities (
  category_id uuid not null references public.categories (id) on delete cascade,
  modality_id uuid not null references public.modalities (id) on delete cascade,
  primary key (category_id, modality_id)
);
create index on public.category_modalities (modality_id);

-- Técnicas, tamanhos, acabamentos e formatos de arquivo de cada modalidade.
create table public.options (
  id uuid primary key default gen_random_uuid(),
  modality_id uuid not null references public.modalities (id) on delete cascade,
  kind public.option_kind not null,
  label text not null check (length(trim(label)) > 0),
  description text not null default '',
  -- Abre campo livre ("Outra técnica", "Tamanho personalizado").
  allows_custom boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.options (modality_id, kind);

-- ---------------------------------------------------------------------------
-- Obras
-- ---------------------------------------------------------------------------

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0),
  short_description text not null default '',
  story text not null default '',
  category_id uuid not null references public.categories (id) on delete restrict,
  modality_id uuid not null references public.modalities (id) on delete restrict,
  technique_option_id uuid references public.options (id) on delete set null,
  -- Texto exibido no card (ex.: "Nanquim"), independente do cadastro de opções.
  technique_label text not null default '',
  dimensions text not null default '',
  featured boolean not null default false,
  sort_order integer not null default 0,
  status public.artwork_status not null default 'rascunho',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.artworks (status, sort_order);
create index on public.artworks (category_id);

create table public.artwork_images (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  -- Caminho no bucket "obras" ou, nos dados provisórios, em /public.
  path text not null check (length(path) > 0),
  alt text not null check (length(trim(alt)) > 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  focal_x smallint not null default 50 check (focal_x between 0 and 100),
  focal_y smallint not null default 50 check (focal_y between 0 and 100),
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.artwork_images (artwork_id, sort_order);
-- No máximo uma capa por obra.
create unique index artwork_images_one_cover on public.artwork_images (artwork_id) where is_cover;

-- ---------------------------------------------------------------------------
-- Pedidos (o registro em si chega na entrega 6, pela função create_order)
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique check (number ~ '^CF-[0-9]{4}-[0-9]{4,}$'),
  -- Gerada no navegador; repetir o envio devolve o mesmo pedido.
  idempotency_key uuid not null unique,
  modality_id uuid references public.modalities (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  technique_option_id uuid references public.options (id) on delete set null,
  size_option_id uuid references public.options (id) on delete set null,
  finish_option_id uuid references public.options (id) on delete set null,
  file_format_option_id uuid references public.options (id) on delete set null,
  -- Cópia em texto das escolhas: o pedido continua legível se o catálogo mudar.
  choices jsonb not null default '{}'::jsonb check (jsonb_typeof(choices) = 'object'),
  custom_technique text,
  custom_size text,
  desired_date date,
  description text not null,
  notes text,
  customer_name text not null check (length(trim(customer_name)) > 0),
  customer_email text not null check (customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_whatsapp text not null,
  city text not null,
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  privacy_accepted_at timestamptz not null,
  privacy_version text not null,
  portfolio_consent boolean not null default false,
  artwork_ref_id uuid references public.artworks (id) on delete set null,
  status public.order_status not null default 'nova',
  quote_cents integer check (quote_cents >= 0),
  confirmed_deadline date,
  email_status public.email_status not null default 'pendente',
  -- IP apenas como hash com sal (LGPD).
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (status, created_at desc);
create index on public.orders (email_status) where email_status <> 'enviado';

create table public.order_references (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  storage_path text not null unique,
  thumbnail_path text,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);
create index on public.order_references (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type public.order_event_type not null,
  from_status public.order_status,
  to_status public.order_status,
  body text,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.order_events (order_id, created_at);

create table public.order_counters (
  year integer primary key,
  last_value integer not null default 0 check (last_value >= 0)
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------------
-- Conteúdo e acesso
-- ---------------------------------------------------------------------------

-- Configurações em chave → JSON. Só as marcadas como públicas chegam ao site.
create table public.settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  location text,
  body text not null check (length(trim(body)) > 0),
  rating smallint check (rating between 1 and 5),
  -- Como e quando o cliente autorizou a publicação.
  consent_note text not null default '',
  -- Exemplo de layout: o site nunca mostra em produção.
  is_demo boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Depoimento real só é publicado com a autorização registrada.
  constraint testimonials_published_needs_consent
    check (not published or is_demo or length(trim(consent_note)) > 0)
);

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create trigger set_updated_at before update on public.modalities
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.options
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.artworks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();
