-- Entrega 5.1: estrutura para o conteúdo real da Carla (docs/conteudo-carla.md).

-- Forma de entrega da obra física (retirada, entrega local, Correios).
-- O novo valor não pode ser usado nesta mesma transação; o seed usa depois.
alter type public.option_kind add value if not exists 'delivery';

-- Coleção nova pode entrar antes de ter foto (o site mostra o símbolo da marca).
alter table public.categories alter column image drop not null;

-- Preço "a partir de" da coleção, quando ela tem preço próprio
-- (ex.: Kit para colorir). null = sem preço exibido.
alter table public.categories
  add column price_cents integer check (price_cents >= 0);

-- Valor de referência mostrado ao cliente. Tamanho: preço "a partir de".
-- Moldura e entrega: acréscimo (0 = sem custo). null = sem preço exibido.
alter table public.options
  add column price_cents integer check (price_cents >= 0);

-- A opção só aparece quando uma destas (de outro grupo) está escolhida.
-- Ex.: "Tinta acrílica" só para quadros; moldura só para a folha A4.
-- Vazio = sempre disponível.
alter table public.options
  add column requires_option_ids uuid[] not null default '{}';

alter table public.orders
  add column delivery_option_id uuid references public.options (id) on delete set null;
