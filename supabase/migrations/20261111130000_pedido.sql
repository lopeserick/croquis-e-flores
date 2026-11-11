-- Entrega 6: registro do pedido. As duas funções só podem ser chamadas pelo
-- servidor (service_role), depois de validar tudo (src/features/orders).

-- ---------------------------------------------------------------------------
-- Limite de tentativas por chave (ex.: "pedido:<hash do IP>"), sem Redis
-- ---------------------------------------------------------------------------

-- Conta um acesso na janela atual e responde se ainda está dentro do limite.
create function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- Janelas antigas não servem mais para nada.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_hits <= p_max;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pedido, fotos de referência e evento inicial numa transação
-- ---------------------------------------------------------------------------

-- p_order: colunas de public.orders em JSON (o servidor monta a partir do
-- rascunho validado). p_references: lista de public.order_references.
-- A mesma idempotency_key devolve o pedido já gravado (created = false):
-- duplo clique ou reenvio depois de uma falha de rede não duplicam o pedido.
create function public.create_order(p_order jsonb, p_references jsonb default '[]'::jsonb)
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
  values (v_id, 'criado', 'nova', 'Pedido enviado pelo site.');

  return query select v_id, v_number, true;
end;
$$;

-- Funções nascem executáveis por todos: aqui, só o servidor.
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
