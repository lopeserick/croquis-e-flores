# Plano inicial (proposta para a Fase 1)

Ponto de partida para a Fase 1 do briefing. **Não é decisão fechada**: revise, aponte problemas e proponha ajustes antes de implementar.

## Stack proposta

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Site, painel e rotas de API num só projeto; integração nativa com a Vercel; SEO com renderização no servidor. |
| Estilo | **Tailwind CSS** com os tokens de `identidade-visual.md` | Componentes consistentes e rápidos de ajustar. |
| Banco | **Supabase (Postgres)** | Persistência real, plano gratuito para começar, Row Level Security. |
| Arquivos | **Supabase Storage** | Bucket público para fotos da galeria; bucket **privado** para referências dos clientes, acessadas por links assinados. |
| Autenticação | **Supabase Auth** | Login do painel da artista. |
| E-mail | **Resend** | E-mail HTML para a artista; funciona bem na Vercel. Exige domínio verificado em produção. |
| Validação | **Zod** | O mesmo schema valida no navegador e no servidor. |
| WhatsApp | Link `https://wa.me/55DDDNUMERO?text=...` | Sem API paga; mensagem montada dinamicamente após o registro do pedido. |
| Testes | Vitest (regras) + Playwright (fluxo de ponta a ponta) | Cobrir o configurador e o envio do pedido. |

## Entidades do banco (rascunho)

- **categories**: id, nome, slug, descrição curta, imagem, ordem, ativo.
- **modalities**: id, nome (pintura física / ilustração digital / ilustração digital impressa), descrição, imagem, ativo.
- **art_types**: id, modality_id, nome, ordem, ativo (as opções da etapa 2 mudam conforme a modalidade).
- **techniques**: id, modality_id, nome, ordem, ativo.
- **sizes**: id, modality_id, rótulo (ex.: "30 × 40 cm", "A3"), personalizado (bool), ordem, ativo.
- **finishes**: id, modality_id, nome (moldura, acabamento), ativo.
- **artworks** (galeria): id, slug, título, história, category_id, modality_id, technique_id, dimensões, destaque (bool), ordem, status (publicada/arquivada), timestamps.
- **artwork_images**: id, artwork_id, caminho no storage, alt, ordem, principal (bool).
- **orders** (solicitações): id, número legível (ex.: `CF-2026-0001`), idempotency_key (único), modalidade, tipo, técnica, tamanho, entrega/formato, acabamento, data desejada, descrição, observações, nome, e-mail, WhatsApp, cidade, UF, aceite de privacidade (data/hora), artwork_ref_id (quando veio de "Criar uma obra inspirada nesta"), status, valor do orçamento, prazo confirmado, notas internas, email_status, timestamps.
- **order_references**: id, order_id, caminho no bucket privado, nome original, tipo MIME, tamanho.
- **order_status_history**: id, order_id, status anterior, novo status, nota, autor, data.
- **settings**: chave/valor (nome do ateliê, logo, e-mail de recebimento, WhatsApp, Instagram, textos institucionais, limites de upload, prazo mínimo).

Guardar as escolhas do pedido também como texto (snapshot), para o pedido não mudar se uma opção for editada depois no painel.

## Fluxo do pedido (ponto mais crítico)

1. O configurador valida cada etapa no navegador (Zod).
2. As imagens sobem **direto do navegador para o bucket privado** usando URLs de upload assinadas. Motivo: funções da Vercel limitam o corpo da requisição a ~4,5 MB, então não dá para passar as fotos pelo servidor.
3. O servidor valida tudo de novo, confere o **tipo real** dos arquivos (assinatura do arquivo, não só a extensão), tamanho e quantidade.
4. Registra o pedido com `idempotency_key` gerado no navegador → cliques repetidos não criam pedidos duplicados.
5. Envia o e-mail para a artista com miniaturas e **links assinados** para os originais. Se o e-mail falhar, o pedido continua registrado (`email_status = falhou`) e aparece no painel.
6. Mostra a tela de sucesso com o número do pedido e o botão "Abrir conversa no WhatsApp". O texto não afirma que a mensagem foi enviada.

Proteções: rate limit por IP, campo honeypot contra bots (Cloudflare Turnstile opcional), limpeza de uploads órfãos.

## Estrutura de pastas (sugestão)

```
src/
  app/
    (site)/            páginas públicas: home, galeria, obra/[slug], como-funciona, sobre, contato, encomendar
    admin/             painel (protegido): dashboard, pedidos, galeria, configurações
    api/               rotas: pedidos, uploads assinados
  components/          ui/ (botões, cards...), site/, admin/, configurador/
  lib/                 supabase/, email/, whatsapp/, validacao/ (schemas Zod), seguranca/
  server/              regras de negócio (criar pedido, mudar status...)
supabase/migrations/   SQL das tabelas, RLS e buckets
tests/                 unitários e e2e
```

## Entregas sugeridas (pequenas e testáveis)

1. **Setup**: projeto, Tailwind com tokens, fontes, layout base, `.env.example`, lint e testes rodando.
2. **Home estática** fiel a `design/home-referencia.html`, responsiva (desktop e celular).
3. **Banco + galeria**: migrations, seed com as 8 obras do protótipo, listagem com filtros e página da obra.
4. **Configurador (interface)**: 9 etapas, barra de progresso, opções dinâmicas por modalidade, calendário, upload com prévia, revisão.
5. **Backend do pedido**: uploads assinados, validação, registro, idempotência, e-mail, link do WhatsApp, rate limit.
6. **Painel: autenticação + pedidos** (dashboard, lista, detalhe, status, orçamento, notas, histórico).
7. **Painel: galeria e configurações** (obras, categorias, técnicas, tamanhos, dados de contato, textos).
8. **Qualidade**: testes e2e, acessibilidade, SEO, desempenho de imagens, revisão no celular.
9. **Publicação**: Vercel, variáveis, domínio, verificação do domínio no Resend, documentação de uso do painel.

## Riscos e cuidados

- **Limite de upload na Vercel** → upload direto para o storage (item 2 do fluxo).
- **E-mail caindo no spam** → domínio verificado (SPF/DKIM) no Resend.
- **LGPD** → aceite registrado com data, política publicada, acesso às fotos só pelo painel, definir por quanto tempo guardar referências.
- **Spam e abuso** → rate limit, honeypot, limite de arquivos.
- **Dependência de dados da Carla** → tudo que é comercial fica configurável (ver pendências em `decisoes.md`).
- **Imagens pesadas no celular** → otimização automática e tamanhos responsivos.
