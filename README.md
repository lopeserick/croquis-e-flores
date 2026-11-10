# site_croquis

Kit de contexto do site **Croquis e Flores**, preparado para ser desenvolvido com o Claude Code.

## O que tem aqui

```
site_croquis/
├── CLAUDE.md                  ← o Claude Code lê este arquivo automaticamente
├── README.md                  ← este guia
├── docs/
│   ├── briefing.md            ← prompt mestre original (requisitos)
│   ├── decisoes.md            ← decisões tomadas e pendências com a Carla
│   ├── identidade-visual.md   ← paleta, fontes, componentes, logo, estrutura da home
│   └── plano-inicial.md       ← proposta de stack, banco e entregas
└── design/
    ├── home-referencia.html   ← protótipo visual da home (abra no navegador)
    ├── logo/                  ← logo escolhida em SVG + página de referência
    └── assets/obras/          ← fotos das obras usadas no protótipo
```

## Como usar com o Claude Code

1. Abra um terminal **dentro desta pasta** (`site_croquis`).
2. (Recomendado) Crie o repositório git: `git init`.
3. Rode `claude`.
4. Primeira mensagem sugerida:

   > Leia o CLAUDE.md e todos os arquivos em docs/ e design/. Depois execute a Fase 1 do briefing (planejamento e arquitetura), usando o docs/plano-inicial.md como ponto de partida. Não programe nada ainda e aguarde minha aprovação.

5. Revise o plano, aprove ou ajuste, e peça uma entrega por vez.

## Rodar o projeto

Requer Node 24.

```
npm install
npx playwright install chromium
cp .env.example .env.local   # e preencha os valores
npm run dev                  # http://localhost:3000
```

Verificações: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.

## Antes de publicar

Veja a lista de pendências em `docs/decisoes.md`. Itens como número do WhatsApp, e-mail de recebimento, categorias reais e autorização de uso das fotos precisam ser confirmados com a Carla.
