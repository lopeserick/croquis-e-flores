-- Armazenamento de arquivos.
--
-- obras:       público (galeria). Qualquer um abre pelo endereço da foto, mas
--              ninguém lista o bucket nem envia arquivos, exceto a Carla.
-- referencias: PRIVADO (fotos dos clientes). Sem política para o público:
--              o servidor gera URLs assinadas de envio e de leitura com validade.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('obras', 'obras', true, 15728640, array['image/jpeg', 'image/png', 'image/webp']),
  ('referencias', 'referencias', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admin gerencia fotos das obras" on storage.objects
  for all to authenticated
  using (bucket_id = 'obras' and (select public.is_admin()))
  with check (bucket_id = 'obras' and (select public.is_admin()));

create policy "admin lê referências dos clientes" on storage.objects
  for select to authenticated
  using (bucket_id = 'referencias' and (select public.is_admin()));
