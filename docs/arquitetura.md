# Arquitetura e plano de execução (Fase 1)

**Status:** proposta apresentada em 09/11/2026, aguardando aprovação. Evolui o `plano-inicial.md`; em conflito, este arquivo vale mais que o plano inicial. Decisões comerciais em aberto estão em `decisoes.md`.

## 1. Visão do produto

Dois usuários:

- **Cliente**: chega pelo Instagram ou WhatsApp, quase sempre no celular. Quer ver obras, entender o processo e pedir um orçamento sem atrito. O configurador é o ponto mais sensível da conversão.
- **Carla**: precisa receber o pedido completo num só lugar, responder rápido e manter a vitrine sem mexer em código. Deve usar o painel pelo celular, então o painel também é pensado primeiro para tela pequena.

Critério de sucesso técnico: **toda solicitação enviada fica registrada no banco e notificada por e-mail**, mesmo que o e-mail atrase ou o cliente nunca abra o WhatsApp.

## 2. Mudanças em relação ao plano inicial

Mantido: Next.js (App Router) + TypeScript, Tailwind, Supabase (Postgres, Storage, Auth), Resend, Zod, Vitest + Playwright, link `wa.me`, upload direto do navegador para o bucket privado, `idempotency_key`, snapshot das escolhas em texto, `email_status`.

Ajustado:

- **Categorias e "tipos de arte" viram uma tabela só** (`categories` + `category_modalities`). Evita duas listas sobrepostas e simplifica "Criar uma obra inspirada nesta".
- **Técnicas, tamanhos, acabamentos e formatos de arquivo numa tabela `options`** com campo `kind`. Uma tela de cadastro no painel em vez de quatro.
- **Histórico, notas internas e registro de e-mails numa tabela `order_events`.**
- **Pedido criado por uma função SQL `create_order`**: pedido, referências e evento inicial numa transação.
- **Links do e-mail não expiram**: apontam para uma rota do painel que exige login e gera um link assinado de curta duração.
- **Rate limit no Postgres**, sem Redis.
- **Configurador em 5 telas** cobrindo as 9 etapas do briefing (seção 7).
- **Novas tabelas**: `testimonials` e `admin_users`.
- **Ordem das entregas**: pedido de ponta a ponta antes do painel.
- **Desenvolvimento** num segundo projeto Supabase gratuito (sem Docker na máquina de desenvolvimento).

## 3. Inconsistências identificadas nos requisitos

1. **Ícone de sacola**: não há carrinho nem conta de cliente; sem função, seria um botão morto. Ver `decisoes.md`.
2. **"Pintura física" / "Tipos de pintura"**: o trabalho manual da Carla é desenho (nanquim, lápis, giz pastel, técnica mista). Nomes editáveis; rótulo inicial a decidir.
3. **Duas taxonomias** (categorias da galeria × tipos de arte do configurador): resolvido pela unificação da seção 2.
4. **Nove etapas no celular**: agrupadas em 5 telas; etapas com uma única opção ativa são preenchidas sozinhas.
5. **Depoimentos demonstrativos**: em produção a seção fica oculta enquanto não houver depoimento real publicado.
6. **"Como funciona" e "Contato"**: "Como funciona" aponta para a seção da home; "Contato" é uma página simples com WhatsApp, Instagram e e-mail, sem formulário.
7. **Fotos de ~760px**: insuficientes para hero e cards em telas de alta densidade (ideal ≥ 1600px). `retrato-folhas.jpg` é horizontal e perde composição no corte 4:5 → ponto focal por imagem, definido no painel.
8. **Retratos de pessoas reais**: exigem autorização de quem aparece (ou do cliente que encomendou), além da autorização da Carla.

## 4. Arquitetura

```
 Celular / navegador
   │  páginas renderizadas no servidor (com cache)
   ▼
 Next.js na Vercel ─────────────► Supabase Postgres  (RLS em todas as tabelas)
   │  Server Actions validadas
   │  com Zod
   │
   ├─ gera URL de upload assinada ─► Supabase Storage
   │                                   ├─ obras/       (público: galeria)
   │                                   └─ referencias/ (privado: fotos dos clientes)
   ├─► Resend (e-mail para a Carla)
   ├─► Vercel Cron (manutenção diária)
   └─► devolve o link wa.me montado no servidor
```

- **Só o servidor acessa o banco.** O navegador não carrega o SDK do Supabase; recebe apenas URLs de upload assinadas e envia os arquivos com `fetch`. A chave secreta fica em variável de ambiente do servidor.
- **RLS como segunda barreira.** Anônimo só lê obras publicadas e catálogo ativo. Pedidos, referências e eventos só para admin.
- **Autenticação**: Supabase Auth com e-mail e senha, cadastro público desligado, permissão em `admin_users`. Verificação no layout do painel **e** em cada Server Action, não só no middleware.
- **Páginas públicas em cache**, revalidadas quando a Carla salva algo no painel.
- **Validação dupla**: o mesmo schema Zod no configurador e na Server Action.
- **Tipo real dos arquivos** checado pelos primeiros bytes (JPEG, PNG, WebP), em função própria e testada.
- **Dependências**: `next`, `react`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `resend`. Desenvolvimento: `vitest`, `@playwright/test`, `eslint`, CLI do Supabase. Calendário com `<input type="date">` nativo. E-mail HTML em template TypeScript com escape do texto do cliente.
- **Convenção**: URLs e interface em português; código e tabelas em inglês.

## 5. Estrutura de pastas

```
src/
  app/
    (site)/                     layout com faixa, cabeçalho e rodapé
      page.tsx                  home
      galeria/page.tsx          listagem + filtros na URL (?modalidade=&tecnica=&q=)
      galeria/[categoria]/      a mesma listagem com a categoria pré-filtrada
      obra/[slug]/              página da obra
      tipos-de-obra/            modalidades e técnicas, com CTA para o configurador
      sobre/  contato/  privacidade/  termos/
      encomendar/               configurador + tela de sucesso
    admin/
      login/
      (painel)/                 layout que verifica a sessão no servidor
        page.tsx                dashboard
        pedidos/  pedidos/[id]/
        obras/  obras/[id]/
        catalogo/               modalidades, categorias, opções
        depoimentos/  configuracoes/
    api/
      admin/referencias/[id]/   exige login e redireciona para link assinado curto
      cron/manutencao/          limpa uploads órfãos, reenvia e-mails que falharam, ping diário
    sitemap.ts  robots.ts
  components/
    ui/                         Button, Badge, Input, ArtworkCard, CollectionCircle…
    site/  configurator/  admin/
  features/                     regras de negócio, sem interface
    orders/                     schema, create-order, whatsapp-link, email-template
    artworks/  catalog/  settings/  testimonials/
  lib/
    supabase/                   server.ts (clientes público e admin), database.types.ts (gerado)
    security/                   file-signature, rate-limit, honeypot, ip-hash
    env.ts                      valida variáveis de ambiente na inicialização
supabase/
  migrations/                   tabelas, RLS, buckets, create_order e hit_rate_limit (entrega 6)
  seed.sql                      catálogo provisório, 7 obras com nomes entre colchetes, depoimentos de exemplo
tests/
  unit/  e2e/
```

## 6. Banco de dados

```
modalities ──< category_modalities >── categories
     │                                    │
     ├──< options (technique | size | finish | file_format | delivery)
     │                                    │
     └──────────< artworks >──────────────┘──< artwork_images
                     │
orders >─────────────┘ (artwork_ref_id, opcional)
  ├──< order_references
  └──< order_events

settings · testimonials · admin_users · rate_limits · order_counters
```

| Tabela | Campos principais |
|---|---|
| **modalities** | slug, nome, descrição, imagem, `delivery_kind` (digital / física), ordem, ativo |
| **categories** | slug, nome, frase curta, imagem, ordem, ativo, `show_on_home` |
| **category_modalities** | quais categorias aparecem como "tipo de arte" em cada modalidade |
| **options** | modality_id, `kind`, rótulo, descrição, `allows_custom` (campo livre para "Outra técnica" / "Tamanho personalizado"), ordem, ativo |
| **artworks** | slug, título, descrição curta, história, category_id, modality_id, technique_option_id, dimensões, destaque, ordem, status (rascunho / publicada / arquivada) |
| **artwork_images** | caminho, alt, largura, altura, ponto focal, ordem, capa |
| **orders** | número (`CF-2026-0001`), `idempotency_key` único, ids **e** snapshot em texto das escolhas, valores personalizados, data desejada, descrição, observações, nome, e-mail, WhatsApp, cidade, UF, aceite de privacidade (data e versão da política), artwork_ref_id, status, orçamento em centavos, prazo confirmado, `email_status`, `ip_hash` |
| **order_references** | order_id, caminho no bucket privado, caminho da miniatura, nome original, MIME, tamanho |
| **order_events** | order_id, tipo (status / nota / email_enviado / email_falhou), status anterior → novo, texto, autor, data |
| **settings** | chave → JSON + `is_public`: nome, contatos, WhatsApp, textos institucionais (públicos); e-mail de recebimento, limites de upload, prazo mínimo (privados) |
| **testimonials** | nome, cidade/UF, texto, nota (opcional), registro da autorização, `is_demo`, publicado, ordem. Depoimento real só é publicado com a autorização registrada (regra no banco) |
| **admin_users** | user_id (Supabase Auth), nome |
| **rate_limits / order_counters** | limite de tentativas por IP (hash) e número sequencial por ano |

Status do pedido (briefing): Nova, Em análise, Orçamento enviado, Aguardando aprovação, Aprovado, Em produção, Concluído, Cancelado. Transições livres; toda mudança registrada em `order_events`.

## 7. Fluxo do cliente

```
Instagram / WhatsApp ─► Home ─┬─► Coleção ─► Galeria (filtros, busca) ─► Obra
                              │                                          │
                              │                       "Criar uma obra inspirada nesta"
                              ▼                                          ▼
                        "Encomende já" ───────────────────────► Configurador
```

Configurador (5 telas cobrindo as 9 etapas):

1. Modalidade e tipo de arte (etapas 1 e 2).
2. Técnica, tamanho e entrega: formato do arquivo, ou moldura e acabamento (etapas 3 a 5).
3. Sua inspiração: fotos com prévia, descrição e data desejada (etapas 6 e 7).
4. Seus dados: nome, e-mail, WhatsApp, cidade, UF, observações e aceite da política (etapa 8).
5. Revisão, com "editar" em cada bloco, e botão "Solicitar orçamento" (etapa 9).

O rascunho (sem as fotos) fica em `sessionStorage`, para não se perder se a aba recarregar ao abrir a câmera no celular.

Envio do pedido:

1. Ao escolher as fotos, o navegador gera uma miniatura e pede URLs de upload assinadas (com rate limit). As fotos sobem para `referencias/pendentes/{chave}/`.
2. "Solicitar orçamento" desativa o botão e envia os dados com a `idempotency_key`.
3. O servidor valida tudo de novo: campos, honeypot, limite por IP, existência e tipo real dos arquivos.
4. `create_order` grava pedido, referências e evento numa transação. A mesma chave devolve o pedido existente, sem duplicar.
5. O servidor envia o e-mail. Se falhar, o pedido continua salvo com `email_status = falhou`, aparece destacado no painel e o cron tenta de novo.
6. Tela de sucesso com o número do pedido e "Abrir conversa no WhatsApp". O texto não diz que a mensagem foi enviada.

## 8. Fluxo da Carla

```
E-mail "Nova solicitação #CF-2026-0007" ─► "Ver no painel" ─► login (se precisar)
                                                                  │
Dashboard (contagem por status, alerta de e-mail que falhou) ─────┤
                                                                  ▼
Pedido: dados do cliente, referências (abrir original), "Conversar no WhatsApp",
        mudar status, registrar orçamento e prazo confirmado, nota interna, histórico

Obras:     cadastrar, editar, fotos com ponto focal, destaque, ordem, arquivar
Catálogo:  modalidades, categorias, técnicas, tamanhos, acabamentos, formatos
Conteúdo:  depoimentos, textos do "Sobre", políticas
Configurações: contatos, e-mail de recebimento, WhatsApp, limites, prazo mínimo
```

## 9. Entregas

| # | Entrega | Como testar |
|---|---|---|
| 1 | **Setup**: `git init`, Next + TS, Tailwind com tokens, fontes, ESLint, Vitest, Playwright, `.env.example`, validação de variáveis | `npm run dev`, `lint`, `test` e `build` passam |
| 2 | **Layout e home estática** fiéis ao protótipo, com dados locais no formato do banco | Comparar com `home-referencia.html` em 375, 768 e 1280px; teclado e foco visível |
| 3 | **Banco**: migrations, RLS, buckets, seed provisório; home lendo do Supabase | Testes de RLS (anônimo não lê pedidos); home igual à da entrega 2 |
| 4 | **Galeria, obra e busca**: filtros, estados vazio/erro/carregando, SEO, imagem de prévia de link | Filtros com URL compartilhável; prévia do link no WhatsApp |
| 5 | **Configurador (interface)**: 5 telas, opções dinâmicas, calendário, upload com prévia e remoção, revisão, rascunho | Testes dos schemas; percurso completo no celular, sem envio |
| 6 | **Pedido de ponta a ponta**: uploads assinados, verificação de tipo, `create_order`, idempotência, rate limit, honeypot, e-mail, WhatsApp | Unitários (link do WhatsApp, assinatura de arquivo, template de e-mail) + e2e (pedido, duplo clique, arquivo falso, falha de e-mail) |
| 7 | **Painel: login e pedidos** | Rotas bloqueadas sem login, inclusive por chamada direta; status com histórico; abertura de referências |
| 8 | **Painel: obras** | Cadastrar obra e vê-la na galeria; arquivar e ela sumir |
| 9 | **Painel: catálogo, depoimentos, textos e configurações** | Desativar técnica e ela sumir do configurador; mudar WhatsApp e o link mudar |
| 10 | **Qualidade**: e2e completos, acessibilidade e contraste, desempenho, iPhone e Android reais, cron, retenção | Relatório dos testes |
| 11 | **Publicação**: Supabase de produção, Vercel, domínio, DNS do Resend, manual do painel | Pedido real de ponta a ponta em produção |

## 10. Riscos e cuidados técnicos

| Risco | Cuidado |
|---|---|
| Supabase gratuito pausa após 7 dias sem uso | Ping diário do cron; considerar plano Pro |
| Vercel Hobby não permite uso comercial | Publicar no plano Pro (ver `decisoes.md`) |
| Sem domínio verificado, o Resend só envia para o e-mail do dono da conta | Em desenvolvimento, usar o e-mail do desenvolvedor; verificar domínio (SPF/DKIM) antes de publicar |
| Limite de ~4,5 MB por requisição na Vercel | Upload direto para o Storage |
| Uploads abandonados ocupando o 1 GB do plano gratuito | Cron apaga pendentes com mais de 24 h; retenção configurável; limite de quantidade e tamanho |
| Abuso da rota de URLs de upload | Rate limit por IP com hash, limite por chave, honeypot; Turnstile pronto para ligar |
| Arquivo malicioso com extensão falsa | Verificação dos primeiros bytes; bucket privado com tipos e tamanho restritos; arquivos nunca servidos no domínio do site |
| Texto do cliente injetando HTML no e-mail | Escape de todo campo, coberto por teste |
| Proteção do painel só no middleware | Checagem no layout, em cada Server Action e nas políticas RLS |
| Fotos HEIC do iPhone e aba recarregando ao abrir a câmera | iOS converte para JPEG quando o campo não aceita HEIC; rascunho em `sessionStorage`; teste em aparelho real |
| Datas e fuso horário | Data desejada como data pura; horários exibidos em `America/Sao_Paulo` |
| LGPD | Aceite com data e versão da política; coleta mínima (só cidade/UF); IP só como hash; retenção e exclusão pelo painel; texto da política vem da Carla ou de um profissional |
| Imagens de baixa resolução e direitos de imagem | Ponto focal por foto; pendências de originais e autorizações em `decisoes.md` |
| Obra/categoria inexistente responde 200 em vez de 404 (pré-renderização parcial envia a casca antes do `notFound()`) | Comportamento documentado do Next 16: a página mostra "Página não encontrada" e recebe `noindex`. Revisto na entrega 4: mantido, porque `dynamicParams = false` daria 404 correto mas impediria obras novas do painel de aparecerem sem novo deploy |
