-- Política de privacidade e termos de uso, editáveis pelo painel (entrega 9).
-- Começam vazios: o site mostra o aviso de pendência até a Carla (ou um
-- profissional) escrever o texto. "do nothing": nunca apaga um texto já salvo.

insert into public.settings (key, is_public, value)
values ('legal', true, '{"privacy": "", "terms": ""}'::jsonb)
on conflict (key) do nothing;
