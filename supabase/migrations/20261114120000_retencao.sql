-- Por quanto tempo guardar as fotos de referência dos clientes depois que o
-- pedido termina (concluído ou cancelado). Privado: só o painel e o servidor
-- leem. Começa desligado (null = não apagar) até a Carla decidir o prazo
-- (docs/decisoes.md, seção 6). A rotina diária (/api/cron/manutencao) aplica.

insert into public.settings (key, is_public, value)
values ('retention', false, '{"referenceDays": null}'::jsonb)
on conflict (key) do nothing;
