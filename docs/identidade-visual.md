# Identidade visual — Croquis e Flores

Referência visual aprovada: `design/home-referencia.html`. Este documento descreve as regras por trás dele.

> A paleta abaixo **substitui** a paleta bege/grafite da seção 3 do briefing. Ver `decisoes.md`.

## Conceito

Galeria de arte contemporânea com o calor da marca pessoal da Carla. A organização comercial se inspira em Vivara e Pandora (faixa superior, logo central, menu em linha, vitrines com setas, coleções em círculos, blocos editoriais), mas **sem copiar** logotipos, layouts proprietários ou elementos exclusivos dessas marcas. As obras são as protagonistas.

## Paleta

| Token sugerido | Hex | Uso |
|---|---|---|
| `cream` | `#FFF7F2` | Fundo principal da página |
| `white` | `#FFFFFF` | Fundo de seções alternadas, cards |
| `blush` | `#FBE4E1` | Fundo do hero, fundos de cards, selos |
| `peach-soft` | `#FDEEE3` | Fundo alternativo (seção "Como funciona") |
| `pink` | `#F2B8B5` | Ilustrações, detalhes decorativos |
| `pink-mid` | `#D9708A` | Ilustrações, marcadores |
| `rose` | `#A8324F` | Faixa superior, bloco editorial, textos de destaque (eyebrows, etiquetas) |
| `apricot` | `#F7C59F` | Botão sobre fundo escuro, script sobre fundo escuro |
| `orange` | `#E8743B` | **Somente decorativo** (não passa contraste com texto branco) |
| `orange-cta` | `#B5461A` | Botões principais ("Encomende já") com texto branco |
| `orange-script` | `#C4551F` | Texto cursivo e sublinhado do menu ativo |
| `plum` | `#2D1B1F` | Texto principal, botões secundários, rodapé |
| `plum-muted` | `#6E5458` | Texto de apoio |
| `plum-soft` | `#5C4448` | Parágrafos longos sobre fundos rosados |
| `border` | `#F2D5D0` | Bordas finas |

Regras:
- Fundos claros predominam. Laranja é a cor que pede clique: use com moderação.
- Um botão laranja principal por área visível; os demais são contorno (borda ameixa) ou link.
- Sem gradientes, sem sombras pesadas, sem bordas grossas.
- Texto sempre com contraste mínimo 4.5:1. Laranja vivo (`#E8743B`) nunca leva texto.

## Tipografia (Google Fonts)

| Papel | Fonte | Uso |
|---|---|---|
| Títulos | **Cormorant Garamond** (400, 500, itálico 400) | H1, H2, nomes de obras, títulos de cards |
| Texto e interface | **Jost** (400, 500) | Parágrafos, menus, botões, formulários, etiquetas |
| Detalhe manuscrito | **Pinyon Script** | Só pontual: "e flores" do logo, pequenas chamadas acima de títulos |

Escala usada no protótipo (desktop): H1 68px · H2 46px · título de card 24px · corpo 16–17px · etiquetas 11–12px com `letter-spacing` 0.16–0.22em em caixa alta. No mobile, reduzir H1 para ~40px e H2 para ~32px.

## Componentes

- **Botão principal**: fundo `orange-cta`, texto branco, caixa alta, `letter-spacing: 0.16em`, 13px, formato pílula (`border-radius: 999px`), altura ≥ 44px.
- **Botão secundário**: borda 1px `plum`, texto `plum`, mesmo formato.
- **Link de ação**: caixa alta pequena com sublinhado (ex.: "VER DETALHES", "VER GALERIA COMPLETA").
- **Card de obra**: imagem 4:5 com cantos de 20px, selo branco no canto superior esquerdo (modalidade), etiqueta "CATEGORIA · TÉCNICA" em `rose`, título serifado, descrição curta, link "Ver detalhes". **Sem preço.**
- **Coleção**: imagem circular de 200px com borda de 6px `blush`, título serifado e frase curta.
- **Etiquetas/pílulas**: fundo branco ou `blush`, texto `rose`.
- **Seções**: alternam fundos (`cream` → `blush` → `cream` → `white` → `peach-soft` → `rose` → `cream` → `white` → `plum`) para separar sem bordas. Padding vertical ~88px no desktop.

## Estrutura da home (ordem)

1. Faixa superior (`rose`): "OBRAS EXCLUSIVAS, CRIADAS ESPECIALMENTE PARA VOCÊ".
2. Cabeçalho: busca à esquerda, logo no centro, sacola/lista de encomendas e "Encomende já" à direita. Menu centralizado abaixo: Início, Galeria, Tipos de pintura, Como funciona, Sobre a artista, Contato. No mobile: menu compacto (hambúrguer) e CTA visível.
3. Hero dividido: texto à esquerda (título "Transforme suas memórias em arte.", descrição, dois botões, três marcadores de modalidade); obra emoldurada em parede rosa à direita.
4. Nossas coleções: 4 círculos.
5. Obras que contam histórias: vitrine com 4 cards e setas.
6. Como funciona: 3 passos numerados com setas tracejadas.
7. Bloco editorial `rose`: "Sua ideia, nossa arte." com transformação foto → ilustração e botão "Personalize seu quadro".
8. Depoimentos: 3 cards **demonstrativos e marcados como tal**, a remover antes de publicar.
9. Sobre a artista: foto em moldura arqueada, "Oi, eu sou a Carla.", frase da bio "meus croquis, minhas flores e eu" em letra cursiva, textos editáveis pelo painel.
10. Rodapé `plum`: logo claro, descrição, navegação, contato (WhatsApp, Instagram, e-mail), institucional (privacidade, termos), botão "Encomende já", direitos autorais.

## Logo

Escolhida: **opção 3, Silhueta de croqui**. Uma figura de moda a traço com a saia em forma de flor (pétalas rosa) e uma rosa laranja na cintura, ao lado do nome "Croquis" (Cormorant Garamond) com "e flores" (Pinyon Script, laranja) deslocado para a direita.

Arquivos em `design/logo/`:
- `simbolo.svg` / `simbolo-claro.svg`: só a figura (para favicon, avatar e selo).
- `logo-horizontal.svg` / `logo-horizontal-claro.svg`: figura + nome (cabeçalho e rodapé).
- `logo-referencia.html`: versão principal e aplicações (fundo escuro, fundo rosa, avatar).

**Provisória:** a versão final deve ser redesenhada à mão pela Carla e vetorizada. Os SVGs de texto dependem das fontes do Google; para impressão, converter textos em contorno.

## Imagens

Fotos em `design/assets/obras/` (capturas do Instagram, ~760px, só para protótipo):

| Arquivo | O que é | Onde aparece no protótipo |
|---|---|---|
| `croqui-vestido-rosa.jpg` | Croqui digital, vestido longo rosa com flor | Hero |
| `croqui-chapeu.jpg` | Croqui a nanquim, chapéu e mangas bufantes | Coleção "Croquis de moda", vitrine |
| `croqui-corset.jpg` | Croqui de corset em caderno kraft | Vitrine |
| `retrato-microfone.jpg` | Retrato digital de cantor | Coleção "Retratos" |
| `retrato-folhas.jpg` | Retrato digital com folhas vermelhas | Vitrine |
| `casal-digital.jpg` | Ilustração digital de casal | Coleção "Casais", bloco editorial |
| `casal-giz.jpg` | Casal sob poste, técnica mista | Coleção "Momentos especiais", vitrine |
| `artista-paleta.jpg` | Foto da Carla com paleta de aquarela | Sobre a artista |

Na versão real, todas as imagens da galeria vêm do banco (cadastradas pelo painel) e são otimizadas (`next/image` ou equivalente). Proporção padrão dos cards: 4:5.

## Tom de voz

Próximo, sensível e profissional. Frases curtas. Verbos no imperativo nos botões ("Encomende já", "Personalize seu quadro"). Nunca prometer prazo ou preço sem confirmação da artista.
