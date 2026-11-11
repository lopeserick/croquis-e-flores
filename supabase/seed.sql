-- DADOS INICIAIS. Pode rodar mais de uma vez: atualiza pelo slug.
--
-- Catálogo, preços, prazos e textos: os informados pela Carla em 10/11/2026
-- (docs/conteudo-carla.md). Fotos: as do protótipo, servidas de
-- /public/demo/obras (não sobem para o bucket enquanto a Carla não autorizar o
-- uso). Nomes de obras entre colchetes são pendências (docs/decisoes.md).
-- Tudo isso passa a ser editado no painel (entregas 8 e 9).

-- ---------------------------------------------------------------------------
-- Modalidades
-- ---------------------------------------------------------------------------

insert into public.modalities (slug, name, description, delivery_kind, sort_order) values
  ('obra-feita-a-mao', 'Obra feita à mão',
   'Quadro em tinta acrílica ou desenho em folha A4 com nanquim ou lápis de cor, feito à mão pela artista.', 'fisica', 1),
  ('ilustracao-digital', 'Ilustração digital',
   'Ilustração feita em software de desenho, entregue em arquivo PDF ou JPG no tamanho A4.', 'digital', 2),
  ('ilustracao-digital-impressa', 'Ilustração digital impressa',
   'Ilustração digital impressa em A4 e entregue com moldura estilo porta-retrato.', 'fisica', 3)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  delivery_kind = excluded.delivery_kind,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Categorias (coleções)
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, tagline, image, price_cents, sort_order)
select v.slug, v.name, v.tagline, v.image::jsonb, v.price_cents, v.sort_order
from (values
  ('retratos', 'Retratos', 'Momentos que ficam para sempre',
   '{"path": "/demo/obras/retrato-microfone.jpg", "alt": "Retrato digital de um cantor segurando o microfone", "width": 712, "height": 696, "focalX": 50, "focalY": 0}',
   null::integer, 1),
  ('casais', 'Casais', 'Amor em cada detalhe',
   '{"path": "/demo/obras/casal-digital.jpg", "alt": "Ilustração digital de um casal abraçado", "width": 712, "height": 434, "focalX": 50, "focalY": 50}',
   null, 2),
  -- Ainda sem foto: o site mostra o símbolo da marca até a Carla mandar uma.
  ('pets', 'Pets', 'Seu bichinho eternizado em arte', null, null, 3),
  ('croquis-de-moda', 'Desenho técnico de moda', 'Moda desenhada à mão',
   '{"path": "/demo/obras/croqui-chapeu.jpg", "alt": "Croqui a nanquim de mulher com chapéu e mangas bufantes", "width": 759, "height": 760, "focalX": 50, "focalY": 50}',
   7000, 4),
  ('kit-para-colorir', 'Kit para colorir', '10 ilustrações para pintar', null, 5500, 5)
) as v (slug, name, tagline, image, price_cents, sort_order)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  image = excluded.image,
  price_cents = excluded.price_cents,
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

-- Provisório (pendência em docs/decisoes.md): toda coleção em toda modalidade,
-- menos o Kit para colorir, que só faz sentido como ilustração (arquivo ou impressa).
delete from public.category_modalities;
insert into public.category_modalities (category_id, modality_id)
select c.id, m.id from public.categories c cross join public.modalities m
where c.slug <> 'kit-para-colorir' or m.slug in ('ilustracao-digital', 'ilustracao-digital-impressa')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Opções do configurador (tamanho, técnica, moldura, formato, entrega)
-- ---------------------------------------------------------------------------
-- Informadas pela Carla. Preço do tamanho = "a partir de"; moldura e entrega =
-- acréscimo (0 = sem custo; null = sob consulta ou incluso).

delete from public.options
where modality_id in (select id from public.modalities where slug in (
  'obra-feita-a-mao', 'ilustracao-digital', 'ilustracao-digital-impressa'
));

insert into public.options (modality_id, kind, label, description, price_cents, sort_order)
select m.id, v.kind::public.option_kind, v.label, v.description, v.price_cents, v.sort_order
from (values
  ('obra-feita-a-mao', 'size', 'Quadro 10 × 15 cm', '', 9000, 1),
  ('obra-feita-a-mao', 'size', 'Quadro 16 × 22 cm', '', 12000, 2),
  ('obra-feita-a-mao', 'size', 'Quadro 20 × 25 cm', '', 14000, 3),
  ('obra-feita-a-mao', 'size', 'Folha A4', '', 10000, 4),
  ('obra-feita-a-mao', 'technique', 'Tinta acrílica', '', null::integer, 1),
  ('obra-feita-a-mao', 'technique', 'Nanquim', '', null, 2),
  ('obra-feita-a-mao', 'technique', 'Lápis de cor', '', null, 3),
  ('obra-feita-a-mao', 'finish', 'Sem moldura', '', null, 1),
  ('obra-feita-a-mao', 'finish', 'Com moldura (porta-retrato)', '', 5000, 2),

  ('ilustracao-digital', 'size', 'A4', '', 8000, 1),
  ('ilustracao-digital', 'technique', 'Desenho digital', '', null, 1),
  ('ilustracao-digital', 'file_format', 'PDF', '', null, 1),
  ('ilustracao-digital', 'file_format', 'JPG', '', null, 2),

  ('ilustracao-digital-impressa', 'size', 'A4', '', 13000, 1),
  ('ilustracao-digital-impressa', 'technique', 'Desenho digital', '', null, 1),
  ('ilustracao-digital-impressa', 'finish', 'Com moldura (porta-retrato)', 'Moldura inclusa no preço.', null, 1)
) as v (modality_slug, kind, label, description, price_cents, sort_order)
join public.modalities m on m.slug = v.modality_slug;

-- Formas de entrega das modalidades físicas.
insert into public.options (modality_id, kind, label, description, price_cents, sort_order)
select m.id, 'delivery', v.label, v.description, v.price_cents, v.sort_order
from (values
  ('Retirada em Feira de Santana',
   'Sem taxa, nos bairros Brasília ou Fraga Maia. O local é combinado com a artista.', 0, 1),
  ('Entrega em Feira de Santana', 'Dentro do Anel de Contorno.', 1000, 2),
  ('Envio pelos Correios', 'Para todo o Brasil. Frete sob consulta.', null::integer, 3)
) as v (label, description, price_cents, sort_order)
cross join public.modalities m
where m.slug in ('obra-feita-a-mao', 'ilustracao-digital-impressa');

-- Dependências na obra feita à mão: acrílica só em quadro; nanquim, lápis de
-- cor e moldura só na folha A4.
update public.options t set requires_option_ids = array(
  select r.id from public.options r
  where r.modality_id = t.modality_id and r.kind = 'size' and r.label = any (v.requires)
)
from (values
  ('Tinta acrílica', array['Quadro 10 × 15 cm', 'Quadro 16 × 22 cm', 'Quadro 20 × 25 cm']),
  ('Nanquim', array['Folha A4']),
  ('Lápis de cor', array['Folha A4']),
  ('Sem moldura', array['Folha A4']),
  ('Com moldura (porta-retrato)', array['Folha A4'])
) as v (label, requires)
where t.label = v.label
  and t.modality_id = (select id from public.modalities where slug = 'obra-feita-a-mao');

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
  ('casal-sob-o-poste', '[Nome da obra: casal sob o poste]', 'casais', 'obra-feita-a-mao', 'Técnica mista', true, 4),
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

-- "Momentos especiais" saiu das coleções (a obra que estava nela foi para Casais).
delete from public.categories where slug = 'momentos-especiais';

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
      "description": "Retratos, casais, pets e croquis de moda inspirados nas suas fotografias e transformados em obras únicas pelas mãos da artista.",
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
    },
    "howItWorks": {
      "subtitle": "Do primeiro rascunho à entrega, em até 15 dias corridos.",
      "steps": [
        {"title": "Escolha da arte", "text": "Você conta a sua ideia e decidimos juntos o tipo de arte."},
        {"title": "Rascunho", "text": "Com o pagamento de 50%, a Carla começa o rascunho."},
        {"title": "Acompanhe a criação", "text": "Você recebe fotos do processo, do rascunho até a finalização."},
        {"title": "Sugira ajustes", "text": "Pode sugerir, elogiar ou pedir alterações durante a confecção."},
        {"title": "Entrega", "text": "A obra chega até você, com o pagamento dos outros 50%."}
      ]
    }
  }$json$),
  ('about', true, $json${
    "heading": "Carla Vitória",
    "signature": "meus croquis, minhas flores e eu",
    "intro": "Sou Carla Vitória, idealizadora do Croquis & Flores, e venho eternizando arte desde 2015. Todas as minhas obras são recheadas de afeto e sensibilidade. E é isso que eu quero te proporcionar: a arte que eu enxerguei em você!",
    "story": "O que me inspira é a minha criança interior e a ideia de que os sonhos podem mudar a realidade.",
    "process": "",
    "differentials": "",
    "photo": {
      "path": "/demo/obras/artista-paleta.jpg",
      "alt": "A artista Carla sorrindo, segurando uma paleta de aquarela em frente ao rosto",
      "width": 758, "height": 950, "focalX": 50, "focalY": 30
    }
  }$json$),
  ('commerce', true, $json${
    "leadTime": "Entrega em até 15 dias corridos após o pagamento inicial.",
    "paymentTerms": "50% para começar o rascunho e 50% no dia da entrega.",
    "paymentMethods": "Pix, transferência, depósito ou boleto (sem cartão).",
    "priceNote": "Os preços são de referência. Personalizações não têm preço fixo: o valor final vem no orçamento, conforme o pedido."
  }$json$)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public;

-- Formulário de encomenda. Prazo mínimo de 15 dias (Carla); limites de fotos
-- ainda provisórios (decisoes.md).
insert into public.settings (key, is_public, value) values
  ('order_form', true, $json${
    "maxFiles": 10,
    "maxFileSizeMb": 10,
    "minLeadDays": 15,
    "askPortfolioConsent": true,
    "privacyPolicyVersion": "provisoria-2026-11"
  }$json$)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public;

-- Privado (só o servidor lê): e-mail que recebe os pedidos. O da Carla até ela
-- confirmar outro (docs/decisoes.md).
insert into public.settings (key, is_public, value) values
  ('notifications', false, $json${ "orderEmail": "croquiseflores@outlook.com" }$json$)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public;

-- ---------------------------------------------------------------------------
-- Depoimentos
-- ---------------------------------------------------------------------------
-- Frases reais da pesquisa de satisfação da Carla. A pesquisa foi anônima: os
-- depoimentos aparecem sem nome até cada cliente confirmar a sua frase
-- (docs/decisoes.md). Os de exemplo saem, porque já há depoimentos reais.

delete from public.testimonials
where is_demo or consent_note like 'Pesquisa de satisfação anônima%';

insert into public.testimonials (name, body, consent_note, published, sort_order)
select
  'Cliente Croquis e Flores', v.body,
  'Pesquisa de satisfação anônima da Carla. Publicação sem nome autorizada por ela em 10/11/2026.',
  true, v.sort_order
from (values
  ('Conseguiu colocar num quadro todo o afeto que eu buscava, com toques lindos e criativos!', 1),
  ('Você foi muito atenciosa do início ao fim, respeitando o que eu queria sem perder seu toque pessoal. E ficar dando feedbacks de como estava o andamento foi fundamental!', 2),
  ('Primeiro ganhei um sorteio, foi quando eu pude conhecer seu trabalho e fiquei apaixonada a ponto de eternizar um pedaço do meu namoro em um quadro que ficou lindo demais.', 3),
  ('Acolher a ideia de arte, mostrar o processo e o rascunho e mudar o que era necessário. A embalagem também é uma tchutchuca!', 4),
  ('Atendimento muito bom, dedicada, cuidadosa. Conversar com você é sentir que já é amiga há um certo tempo, de tão leve que você passa.', 5),
  ('Você demonstrou cuidado e carinho em cada detalhe, dando importância a deixar tudo lindo. Eu amei!', 6),
  ('Admirava o traço da artista e gosto de apoiar artistas, principalmente sendo mulheres!', 7)
) as v (body, sort_order);
