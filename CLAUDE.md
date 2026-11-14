# Croquis e Flores — site de encomendas de arte

Site da artista **Carla** (Instagram: @croquiseflores), que faz croquis de moda, retratos e ilustrações sob encomenda. O site é uma vitrine premium com fluxo de **solicitação de orçamento**: o cliente configura a obra, envia referências, a artista recebe tudo por e-mail e o cliente pode abrir uma conversa no WhatsApp. Não há pagamento online nesta versão.

Publicação prevista: **Vercel**.

## Leia antes de qualquer coisa

1. `docs/briefing.md`: requisitos completos (o "prompt mestre"). É a fonte da verdade dos requisitos.
2. `docs/decisoes.md`: o que já foi decidido e o que **mudou em relação ao briefing**. Em conflito, `decisoes.md` vale mais que o briefing.
   `docs/conteudo-carla.md`: textos, coleções, preços, prazos e entrega informados pela Carla (valores iniciais reais).
3. `docs/identidade-visual.md`: paleta, fontes, componentes, logo e estrutura da home.
4. `docs/plano-inicial.md`: proposta de stack, banco e entregas. É ponto de partida para a Fase 1, não decisão fechada.
5. `design/home-referencia.html`: protótipo visual aprovado da página inicial. Abra no navegador e use como referência de layout, espaçamento e hierarquia.
6. `design/logo/`: logo escolhida (símbolo e versões horizontais em SVG) e `logo-referencia.html`.
7. `design/assets/obras/`: fotos reais das obras da Carla, usadas no protótipo.
8. `docs/arquitetura.md`: plano aprovado da Fase 1 (arquitetura, banco, fluxos, entregas, riscos).
9. `docs/plano-aprovado.md`: andamento. **Ao fim de cada entrega, atualize este arquivo** com o que foi entregue e como conferir, em checklists curtas.

## Como trabalhar neste projeto

Siga a metodologia das seções 14 e 15 do briefing:

- **Comece pela Fase 1 (planejamento) e não programe nada antes da aprovação.** Apresente arquitetura, estrutura de pastas, entidades do banco, fluxos, pontos de decisão comercial, entregas e riscos. Aguarde aprovação.
- Trabalhe **uma entrega por vez**, pequena e testável. Ao fim de cada uma, diga o que foi feito, o que falta e como testar.
- Uma funcionalidade só está pronta quando funciona de ponta a ponta, não quando a tela está bonita.
- **Não invente** preços, prazos, políticas comerciais, depoimentos, avaliações ou informações da artista. Onde faltar dado, use placeholder entre colchetes (ex.: `[Nome da obra]`) e registre a pendência.
- Decisão que depende de informação comercial: apresente a dúvida e implemente uma solução provisória **configurável pelo painel**.
- Não instale dependências desnecessárias. Prefira a solução mais simples que seja segura.
- Escreva testes para regras de negócio e para o fluxo de encomenda (validação, registro, upload, e-mail, link do WhatsApp, prevenção de duplicidade).

## Regras fixas

- Interface, textos e mensagens em **português do Brasil**.
- **Nunca** coloque senhas, tokens ou chaves no código. Use `.env.local` (fora do git) e documente as variáveis em `.env.example`.
- Fotos enviadas pelos clientes ficam em armazenamento **privado** e só são acessadas por links assinados com validade. Nunca aparecem na galeria pública.
- Rotas do painel administrativo protegidas por autenticação, no servidor (não só esconder na interface).
- Validação de formulários no frontend **e** no backend.
- Layout responsivo pensado para celular primeiro: a maior parte do público chega pelo Instagram e pelo WhatsApp.
- Acessibilidade: HTML semântico, `alt` nas imagens, contraste mínimo 4.5:1 em texto, foco visível, alvos de toque de pelo menos 44px.

## Comandos

Node 24 + npm. Antes do primeiro uso: `npm install`, `npx playwright install chromium` e copie `.env.example` para `.env.local`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor local em http://localhost:3000 |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos das rotas e roda o TypeScript |
| `npm test` | Testes de unidade (Vitest, `tests/unit/`) |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright, `tests/e2e/`), em celular e desktop |
| `npm run build` | Build de produção (lê o Supabase durante a pré-renderização) |
| `npm run test:db` | Testes contra o Supabase de desenvolvimento (RLS, buckets, seed). Usa rede e `.env.local` |
| `npm run db:push` | Aplica as migrations de `supabase/migrations/` no projeto vinculado |
| `npm run db:seed` | Executa o `supabase/seed.sql` no projeto vinculado (só desenvolvimento; pode rodar de novo) |
| `npm run db:types` | Regenera `src/lib/supabase/database.types.ts` a partir do banco |
| `npm run admin -- criar email "Nome"` | Cria conta do painel (pede a senha no terminal). Também: `senha email`, `remover email` |

Stack: Next.js 16.4 (App Router, Cache Components), React 19, Tailwind 4, Zod 4. **O Next 16.4 tem APIs diferentes das versões antigas**: consulte `node_modules/next/dist/docs/` antes de usar uma API do Next (ver `AGENTS.md`).

- Tokens de cor e fontes ficam em `src/app/globals.css`. A paleta padrão do Tailwind foi removida: use só as cores da marca (`bg-cream`, `text-plum`, `bg-orange-cta`…).
- Variáveis de ambiente são lidas só por `getEnv(grupo)` em `src/lib/env.ts`, que valida o grupo na primeira vez que ele é usado.
- Banco: só o servidor acessa (`src/lib/supabase/server.ts`). Páginas públicas usam `createPublicClient()` (chave pública, sujeita ao RLS); `createAdminClient()` ignora o RLS e só entra depois de checar permissão. Toda tabela nova precisa de RLS, grants explícitos e teste em `tests/db/`.
- Leituras públicas ficam em funções `"use cache"` com `cacheLife` e `cacheTag` (`src/lib/cache-tags.ts`); o painel invalida a etiqueta ao salvar.
- Mudou o banco? Nova migration em `supabase/migrations/`, `npm run db:push`, `npm run db:types`.
- Regras do pedido ficam em `src/features/orders/schema.ts` e são as mesmas no configurador (navegador) e no envio (servidor). Não duplique validação em componente.
- Painel (`/admin`): `src/proxy.ts` só renova a sessão e manda para o login; a permissão de verdade é `requireAdmin()` (`src/features/admin/auth.ts`) em toda página, Server Action e rota, e o painel lê com `createSessionClient()` (sessão da Carla, sob o RLS). Leitura da sessão sempre dentro de `<Suspense>`.
- Painel que muda o site (obras, catálogo, depoimentos, textos): toda Server Action termina com `siteContentChanged(etiqueta)` (`src/features/admin/site-cache.ts`). Só `updateTag` não basta: no `next start` a primeira visita depois da mudança ainda recebia a página antiga. Formulários do painel usam `useFormAction` (`src/components/admin/use-form-action.ts`), que não apaga o que foi digitado quando há erro.
- Fotos da galeria (obras, coleções, modalidades, textos do site): bucket público `obras`, pastas `obras/`, `colecoes/`, `modalidades/` e `site/`. O banco guarda o caminho relativo e `resolveImagePath` (`src/features/catalog/image-url.ts`) monta o endereço; caminhos que começam com `/` são da pasta `public/` (dados provisórios). O navegador reduz e converte a foto para WebP antes de enviar, e o servidor confere os primeiros bytes (`src/features/admin/gallery-upload.ts`).
- Testes de navegador que mudam o conteúdo pelo painel ficam em `tests/e2e/painel-*.spec.ts` e rodam no projeto `painel`, depois dos outros. Só eles: `npx playwright test --project=painel --no-deps`.
- Rotina diária: `/api/cron/manutencao` (Vercel Cron em `vercel.json`, exige `Authorization: Bearer CRON_SECRET`). Tarefas em `src/features/maintenance/run.ts` (reenvio de e-mails, fotos abandonadas, fotos da galeria sem uso, retenção configurável no painel); regras puras em `rules.ts`. Cada tarefa aceita `only` para os testes não tocarem em outros dados.
- Testes de navegador não podem depender de quantas obras, coleções ou depoimentos existem: compare com o banco (`visibleArtworks()`, `homeCollections()` em `tests/e2e/support/db.ts`).
- Envio do pedido: `src/features/orders/create-order.ts` (só servidor) valida tudo de novo e chama a função SQL `create_order`. As fotos sobem do navegador por link assinado. Os testes `tests/e2e/order.spec.ts` gravam no Supabase de desenvolvimento e apagam o que criam (`tests/e2e/support/db.ts`).
- Rotas com `params`/`searchParams` leem esses valores dentro de `<Suspense>` (aviso "instant-shell-url-data" do Next 16.4).
- Arquitetura e plano de entregas: `docs/arquitetura.md`.
