-- DADOS PROVISÓRIOS (entrega 3). Pode rodar mais de uma vez: atualiza pelo slug.
--
-- Fotos do protótipo, servidas de /public/demo/obras (não sobem para o bucket
-- enquanto a Carla não autorizar o uso). Textos entre colchetes e depoimentos
-- marcados como demonstração são pendências (docs/decisoes.md). Tudo isso será
-- substituído pelo cadastro real no painel (entregas 8 e 9).

-- ---------------------------------------------------------------------------
-- Modalidades
-- ---------------------------------------------------------------------------

insert into public.modalities (slug, name, description, delivery_kind, sort_order) values
  ('obra-feita-a-mao', 'Obra feita à mão',
   '[Descrição da modalidade: técnicas manuais, suporte e acabamento.]', 'fisica', 1),
  ('ilustracao-digital', 'Ilustração digital',
   '[Descrição da modalidade: arquivo digital em alta resolução.]', 'digital', 2),
  ('ilustracao-digital-impressa', 'Ilustração digital impressa',
   '[Descrição da modalidade: impressão, papel e opções de moldura.]', 'fisica', 3)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  delivery_kind = excluded.delivery_kind,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, tagline, image, sort_order) values
  ('croquis-de-moda', 'Croquis de moda', 'Moda desenhada à mão',
   '{"path": "/demo/obras/croqui-chapeu.jpg", "alt": "Croqui a nanquim de mulher com chapéu e mangas bufantes", "width": 759, "height": 760, "focalX": 50, "focalY": 50}',
   1),
  ('retratos', 'Retratos', 'Momentos que ficam para sempre',
   '{"path": "/demo/obras/retrato-microfone.jpg", "alt": "Retrato digital de um cantor segurando o microfone", "width": 712, "height": 696, "focalX": 50, "focalY": 0}',
   2),
  ('casais', 'Casais', 'Amor em cada detalhe',
   '{"path": "/demo/obras/casal-digital.jpg", "alt": "Ilustração digital de um casal abraçado", "width": 712, "height": 434, "focalX": 50, "focalY": 50}',
   3),
  ('momentos-especiais', 'Momentos especiais', 'Histórias que merecem ser eternizadas',
   '{"path": "/demo/obras/casal-giz.jpg", "alt": "Desenho em técnica mista de um casal sob um poste, em tons de laranja e rosa", "width": 712, "height": 950, "focalX": 50, "focalY": 60}',
   4)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  image = excluded.image,
  sort_order = excluded.sort_order;

-- Imagem demonstrativa de cada modalidade (configurador e "Tipos de obra").
update public.modalities m set image = v.image::jsonb
from (values
  ('obra-feita-a-mao',
   '{"path": "/demo/obras/croqui-chapeu.jpg", "alt": "Croqui a nanquim de mulher com chapéu e mangas bufantes", "width": 759, "height": 760, "focalX": 60, "focalY": 45}'),
  ('ilustracao-digital',
   '{"path": "/demo/obras/casal-digital.jpg", "alt": "Ilustração digital de um casal abraçado", "width": 712, "height": 434, "focalX": 50, "focalY": 50}'),
  ('ilustracao-digital-impressa',
   '{"path": "/demo/obras/croqui-vestido-rosa.jpg", "alt": "Croqui digital de uma mulher com vestido longo rosa e flor na cintura", "width": 759, "height": 760, "focalX": 50, "focalY": 40}')
) as v (slug, image)
where m.slug = v.slug;

-- Provisório: toda categoria disponível em toda modalidade, até a Carla
-- definir o que oferece em cada uma.
insert into public.category_modalities (category_id, modality_id)
select c.id, m.id from public.categories c cross join public.modalities m
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Opções do configurador (técnica, tamanho, acabamento, formato de arquivo)
-- ---------------------------------------------------------------------------
-- Provisório. Listas do briefing (seção 6, etapas 3 a 5) mais as técnicas que
-- aparecem no portfólio da Carla (nanquim, lápis, giz pastel, técnica mista).
-- Ela confirma o que oferece de fato e ajusta no painel (entrega 9).

delete from public.options
where modality_id in (select id from public.modalities where slug in (
  'obra-feita-a-mao', 'ilustracao-digital', 'ilustracao-digital-impressa'
));

insert into public.options (modality_id, kind, label, allows_custom, sort_order)
select m.id, v.kind::public.option_kind, v.label, v.allows_custom, v.sort_order
from (values
  ('obra-feita-a-mao', 'technique', 'Nanquim', false, 1),
  ('obra-feita-a-mao', 'technique', 'Lápis', false, 2),
  ('obra-feita-a-mao', 'technique', 'Giz pastel', false, 3),
  ('obra-feita-a-mao', 'technique', 'Técnica mista', false, 4),
  ('obra-feita-a-mao', 'technique', 'Aquarela', false, 5),
  ('obra-feita-a-mao', 'technique', 'Acrílica', false, 6),
  ('obra-feita-a-mao', 'technique', 'Óleo', false, 7),
  ('obra-feita-a-mao', 'technique', 'Outra técnica', true, 8),
  ('obra-feita-a-mao', 'size', '20 × 30 cm', false, 1),
  ('obra-feita-a-mao', 'size', '30 × 40 cm', false, 2),
  ('obra-feita-a-mao', 'size', '40 × 60 cm', false, 3),
  ('obra-feita-a-mao', 'size', '50 × 70 cm', false, 4),
  ('obra-feita-a-mao', 'size', 'Tamanho personalizado', true, 5),
  ('obra-feita-a-mao', 'finish', 'Sem moldura', false, 1),
  ('obra-feita-a-mao', 'finish', 'Com moldura', false, 2),

  ('ilustracao-digital', 'technique', 'Ilustração digital', false, 1),
  ('ilustracao-digital', 'technique', 'Estilo aquarela digital', false, 2),
  ('ilustracao-digital', 'technique', 'Pintura digital', false, 3),
  ('ilustracao-digital', 'technique', 'Estilo vetorial', false, 4),
  ('ilustracao-digital', 'technique', 'Outro estilo', true, 5),
  ('ilustracao-digital', 'size', 'Formato para redes sociais', false, 1),
  ('ilustracao-digital', 'size', 'A4', false, 2),
  ('ilustracao-digital', 'size', 'A3', false, 3),
  ('ilustracao-digital', 'size', 'A2', false, 4),
  ('ilustracao-digital', 'size', 'Resolução ou dimensão personalizada', true, 5),
  ('ilustracao-digital', 'file_format', 'PNG', false, 1),
  ('ilustracao-digital', 'file_format', 'JPG', false, 2),
  ('ilustracao-digital', 'file_format', 'PDF', false, 3),

  ('ilustracao-digital-impressa', 'technique', 'Ilustração digital', false, 1),
  ('ilustracao-digital-impressa', 'technique', 'Estilo aquarela digital', false, 2),
  ('ilustracao-digital-impressa', 'technique', 'Pintura digital', false, 3),
  ('ilustracao-digital-impressa', 'technique', 'Estilo vetorial', false, 4),
  ('ilustracao-digital-impressa', 'technique', 'Outro estilo', true, 5),
  ('ilustracao-digital-impressa', 'size', 'A4', false, 1),
  ('ilustracao-digital-impressa', 'size', 'A3', false, 2),
  ('ilustracao-digital-impressa', 'size', 'A2', false, 3),
  ('ilustracao-digital-impressa', 'size', '20 × 30 cm', false, 4),
  ('ilustracao-digital-impressa', 'size', '30 × 40 cm', false, 5),
  ('ilustracao-digital-impressa', 'size', '40 × 60 cm', false, 6),
  ('ilustracao-digital-impressa', 'size', 'Tamanho personalizado', true, 7),
  ('ilustracao-digital-impressa', 'finish', 'Sem moldura', false, 1),
  ('ilustracao-digital-impressa', 'finish', 'Com moldura', false, 2)
) as v (modality_slug, kind, label, allows_custom, sort_order)
join public.modalities m on m.slug = v.modality_slug;

-- ---------------------------------------------------------------------------
-- Obras
-- ---------------------------------------------------------------------------

insert into public.artworks
  (slug, title, short_description, category_id, modality_id, technique_label, featured, sort_order, status, published_at)
select
  v.slug, v.title, '[Descrição curta da obra e da história por trás dela.]',
  c.id, m.id, v.technique, v.featured, v.sort_order, 'publicada', now()
from (values
  ('croqui-corset', '[Nome da obra: croqui do corset]', 'croquis-de-moda', 'obra-feita-a-mao', 'Desenho', true, 1),
  ('retrato-folhas-vermelhas', '[Nome da obra: retrato com folhas vermelhas]', 'retratos', 'ilustracao-digital', 'Ilustração digital', true, 2),
  ('croqui-chapeu', '[Nome da obra: croqui com chapéu]', 'croquis-de-moda', 'obra-feita-a-mao', 'Nanquim', true, 3),
  ('casal-sob-o-poste', '[Nome da obra: casal sob o poste]', 'momentos-especiais', 'obra-feita-a-mao', 'Técnica mista', true, 4),
  ('casal-abracado', '[Nome da obra: casal abraçado]', 'casais', 'ilustracao-digital', 'Ilustração digital', true, 5),
  ('retrato-cantor', '[Nome da obra: retrato do cantor]', 'retratos', 'ilustracao-digital', 'Ilustração digital', true, 6),
  ('croqui-vestido-rosa', '[Nome da obra: croqui do vestido rosa]', 'croquis-de-moda', 'ilustracao-digital', 'Ilustração digital', false, 7)
) as v (slug, title, category_slug, modality_slug, technique, featured, sort_order)
join public.categories c on c.slug = v.category_slug
join public.modalities m on m.slug = v.modality_slug
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  category_id = excluded.category_id,
  modality_id = excluded.modality_id,
  technique_label = excluded.technique_label,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  status = excluded.status;

-- Uma foto (capa) por obra. Recria as fotos das obras provisórias.
delete from public.artwork_images
where artwork_id in (select id from public.artworks where slug in (
  'croqui-corset', 'retrato-folhas-vermelhas', 'croqui-chapeu', 'casal-sob-o-poste',
  'casal-abracado', 'retrato-cantor', 'croqui-vestido-rosa'
));

insert into public.artwork_images (artwork_id, path, alt, width, height, focal_x, focal_y, sort_order, is_cover)
select a.id, v.path, v.alt, v.width, v.height, v.focal_x, v.focal_y, 1, true
from (values
  ('croqui-corset', '/demo/obras/croqui-corset.jpg',
   'Croqui de corset colorido desenhado em caderno de papel kraft', 712, 620, 50, 50),
  ('retrato-folhas-vermelhas', '/demo/obras/retrato-folhas.jpg',
   'Retrato digital de um homem cantando, cercado por folhas vermelhas', 758, 435, 58, 50),
  ('croqui-chapeu', '/demo/obras/croqui-chapeu.jpg',
   'Croqui a nanquim de mulher com chapéu e mangas bufantes', 759, 760, 65, 50),
  ('casal-sob-o-poste', '/demo/obras/casal-giz.jpg',
   'Desenho em técnica mista de um casal sob um poste, em tons de laranja e rosa', 712, 950, 50, 50),
  ('casal-abracado', '/demo/obras/casal-digital.jpg',
   'Ilustração digital de um casal abraçado', 712, 434, 50, 50),
  ('retrato-cantor', '/demo/obras/retrato-microfone.jpg',
   'Retrato digital de um cantor segurando o microfone', 712, 696, 50, 0),
  ('croqui-vestido-rosa', '/demo/obras/croqui-vestido-rosa.jpg',
   'Croqui digital de uma mulher com vestido longo rosa e flor na cintura', 759, 760, 50, 50)
) as v (slug, path, alt, width, height, focal_x, focal_y)
join public.artworks a on a.slug = v.slug;

-- ---------------------------------------------------------------------------
-- Configurações públicas do site
-- ---------------------------------------------------------------------------

insert into public.settings (key, is_public, value) values
  ('site', true, $json${
    "siteName": "Croquis e Flores",
    "topBarMessage": "Obras exclusivas, criadas especialmente para você",
    "footerDescription": "Obras personalizadas, criadas à mão a partir das suas memórias.",
    "instagramHandle": "croquiseflores",
    "whatsappNumber": "5575988498356",
    "contactEmail": "croquiseflores@outlook.com"
  }$json$),
  ('home', true, $json${
    "hero": {
      "eyebrow": "Arte personalizada · Feita à mão",
      "title": "Transforme suas memórias em",
      "titleEmphasis": "arte.",
      "description": "Quadros personalizados inspirados em fotografias, paisagens e momentos especiais, transformados em obras únicas pelas mãos da artista.",
      "highlights": ["Obras feitas à mão", "Ilustrações digitais", "Impressões emolduradas"],
      "image": {
        "path": "/demo/obras/croqui-vestido-rosa.jpg",
        "alt": "Croqui digital de uma mulher com vestido longo rosa e flor na cintura",
        "width": 759, "height": 760, "focalX": 50, "focalY": 50
      },
      "imageCaption": "Croqui digital · Croquis e Flores"
    },
    "editorialExample": {
      "path": "/demo/obras/casal-digital.jpg",
      "alt": "Ilustração digital de um casal abraçado",
      "width": 712, "height": 434, "focalX": 50, "focalY": 50
    }
  }$json$),
  ('about', true, $json${
    "heading": "Oi, eu sou a Carla.",
    "signature": "meus croquis, minhas flores e eu",
    "intro": "[Apresentação da artista: quem ela é, como começou a desenhar e o que a inspira.]",
    "story": "[História do trabalho artístico.]",
    "process": "[Processo de criação: como uma encomenda vira obra.]",
    "differentials": "[Diferenciais do trabalho.]",
    "photo": {
      "path": "/demo/obras/artista-paleta.jpg",
      "alt": "A artista Carla sorrindo, segurando uma paleta de aquarela em frente ao rosto",
      "width": 758, "height": 950, "focalX": 50, "focalY": 30
    }
  }$json$)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public;

-- Limites do formulário de encomenda (decisoes.md: padrão técnico provisório).
insert into public.settings (key, is_public, value) values
  ('order_form', true, $json${
    "maxFiles": 10,
    "maxFileSizeMb": 10,
    "minLeadDays": 1,
    "askPortfolioConsent": true,
    "privacyPolicyVersion": "provisoria-2026-11"
  }$json$)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public;

-- ---------------------------------------------------------------------------
-- Depoimentos de exemplo (nunca aparecem no build de produção)
-- ---------------------------------------------------------------------------

delete from public.testimonials where is_demo;

insert into public.testimonials (name, location, body, rating, is_demo, published, sort_order)
select
  '[Nome do cliente]', '[Cidade/UF]',
  '[Depoimento real do cliente, com autorização para publicação.]',
  5, true, true, n
from generate_series(1, 3) as n;
