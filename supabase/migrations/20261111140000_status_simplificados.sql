-- Status do pedido simplificados a pedido da Carla (11/11/2026):
-- Novo, Orçamento enviado, Aprovado (em produção), Concluído, Cancelado.
-- Pedidos e histórico existentes são convertidos para o status mais próximo.

create type public.order_status_v2 as enum ('novo', 'orcamento_enviado', 'aprovado', 'concluido', 'cancelado');

create function pg_temp.to_v2(value public.order_status)
returns public.order_status_v2
language sql
immutable
as $$
  select (case value::text
    when 'nova' then 'novo'
    when 'em_analise' then 'novo'
    when 'aguardando_aprovacao' then 'orcamento_enviado'
    when 'em_producao' then 'aprovado'
    else value::text
  end)::public.order_status_v2;
$$;

alter table public.orders alter column status drop default;
alter table public.orders alter column status type public.order_status_v2 using pg_temp.to_v2(status);
alter table public.orders alter column status set default 'novo';

alter table public.order_events
  alter column from_status type public.order_status_v2 using pg_temp.to_v2(from_status),
  alter column to_status type public.order_status_v2 using pg_temp.to_v2(to_status);

drop function pg_temp.to_v2(public.order_status);
drop type public.order_status;
alter type public.order_status_v2 rename to order_status;

-- create_order gravava o evento inicial como 'nova'.
create or replace function public.create_order(p_order jsonb, p_references jsonb default '[]'::jsonb)
returns table (order_id uuid, order_number text, created boolean)
language plpgsql
set search_path = ''
as $$
declare
  v_key uuid := (p_order ->> 'idempotency_key')::uuid;
  v_year integer := extract(year from now() at time zone 'America/Sao_Paulo')::integer;
  v_seq integer;
  v_id uuid;
  v_number text;
begin
  if v_key is null then
    raise exception 'idempotency_key obrigatória';
  end if;

  -- Dois envios simultâneos com a mesma chave esperam um pelo outro.
  perform pg_advisory_xact_lock(hashtextextended(v_key::text, 0));

  select o.id, o.number into v_id, v_number from public.orders o where o.idempotency_key = v_key;
  if found then
    return query select v_id, v_number, false;
    return;
  end if;

  insert into public.order_counters as c (year, last_value)
  values (v_year, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into v_seq;
  v_number := format('CF-%s-%s', v_year, lpad(v_seq::text, 4, '0'));

  insert into public.orders (
    number, idempotency_key,
    modality_id, category_id, technique_option_id, size_option_id, finish_option_id,
    file_format_option_id, delivery_option_id, choices, custom_technique, custom_size,
    desired_date, description, notes,
    customer_name, customer_email, customer_whatsapp, city, state,
    privacy_accepted_at, privacy_version, portfolio_consent, artwork_ref_id, ip_hash
  )
  select
    v_number, v_key,
    r.modality_id, r.category_id, r.technique_option_id, r.size_option_id, r.finish_option_id,
    r.file_format_option_id, r.delivery_option_id, coalesce(r.choices, '{}'::jsonb), r.custom_technique, r.custom_size,
    r.desired_date, r.description, r.notes,
    r.customer_name, r.customer_email, r.customer_whatsapp, r.city, r.state,
    -- O aceite vale a partir do registro no servidor, não do relógio do navegador.
    now(), r.privacy_version, coalesce(r.portfolio_consent, false), r.artwork_ref_id, r.ip_hash
  from jsonb_populate_record(null::public.orders, p_order) r
  returning id into v_id;

  insert into public.order_references (order_id, storage_path, original_name, mime_type, size_bytes)
  select v_id, f.storage_path, f.original_name, f.mime_type, f.size_bytes
  from jsonb_populate_recordset(null::public.order_references, p_references) f;

  insert into public.order_events (order_id, type, to_status, body)
  values (v_id, 'criado', 'novo', 'Pedido enviado pelo site.');

  return query select v_id, v_number, true;
end;
$$;
