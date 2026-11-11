-- Quem pode ler e escrever o quê (docs/arquitetura.md, seção 4).
--
-- O site lê com a chave pública (papel "anon"): só obras publicadas, catálogo
-- ativo, depoimentos publicados e configurações públicas. Pedidos, referências
-- e eventos são só da Carla (admin). Tabelas internas (contadores, limites)
-- não têm política nenhuma: só o servidor, com a chave secreta, as acessa.

-- ---------------------------------------------------------------------------
-- Quem é admin
-- ---------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Privilégios de tabela (primeira barreira; as políticas abaixo são a segunda)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
-- Tabelas criadas em migrations futuras também nascem fechadas.
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on
  public.modalities,
  public.categories,
  public.category_modalities,
  public.options,
  public.artworks,
  public.artwork_images,
  public.settings,
  public.testimonials
to anon, authenticated;

-- Escrita do painel: só usuários logados, e as políticas exigem is_admin().
grant insert, update, delete on
  public.modalities,
  public.categories,
  public.category_modalities,
  public.options,
  public.artworks,
  public.artwork_images,
  public.settings,
  public.testimonials
to authenticated;

grant select, insert, update, delete on
  public.orders,
  public.order_references,
  public.order_events
to authenticated;

grant select on public.admin_users to authenticated;

grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- RLS em todas as tabelas
-- ---------------------------------------------------------------------------

alter table public.modalities enable row level security;
alter table public.categories enable row level security;
alter table public.category_modalities enable row level security;
alter table public.options enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_references enable row level security;
alter table public.order_events enable row level security;
alter table public.order_counters enable row level security;
alter table public.rate_limits enable row level security;
alter table public.settings enable row level security;
alter table public.testimonials enable row level security;
alter table public.admin_users enable row level security;

-- Catálogo: público vê o que está ativo; admin vê e edita tudo.

create policy "público lê modalidades ativas" on public.modalities
  for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "admin edita modalidades" on public.modalities
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "público lê categorias ativas" on public.categories
  for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "admin edita categorias" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "público lê vínculos categoria-modalidade" on public.category_modalities
  for select to anon, authenticated
  using (true);
create policy "admin edita vínculos categoria-modalidade" on public.category_modalities
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "público lê opções ativas" on public.options
  for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "admin edita opções" on public.options
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Obras: público só vê publicadas (rascunho e arquivada ficam ocultos).

create policy "público lê obras publicadas" on public.artworks
  for select to anon, authenticated
  using (status = 'publicada' or (select public.is_admin()));
create policy "admin edita obras" on public.artworks
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "público lê fotos de obras publicadas" on public.artwork_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_id and a.status = 'publicada'
    )
    or (select public.is_admin())
  );
create policy "admin edita fotos de obras" on public.artwork_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Pedidos: nenhum acesso público. O cliente cria o pedido pelo servidor
-- (função create_order, entrega 6), nunca direto pela API.

create policy "admin gerencia pedidos" on public.orders
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin gerencia referências" on public.order_references
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin gerencia eventos" on public.order_events
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Conteúdo.

create policy "público lê configurações públicas" on public.settings
  for select to anon, authenticated
  using (is_public or (select public.is_admin()));
create policy "admin edita configurações" on public.settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "público lê depoimentos publicados" on public.testimonials
  for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "admin edita depoimentos" on public.testimonials
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Cada admin vê só o próprio registro; cadastro de admin é feito pelo servidor.
create policy "admin lê o próprio registro" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));
