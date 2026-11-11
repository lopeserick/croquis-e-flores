# Plano aprovado: andamento

Atualizado a cada entrega. Plano completo: `arquitetura.md`. Pendências e decisões: `decisoes.md`.

**Última atualização:** 10/11/2026, entrega 5.

## Visão geral

- [x] Fase 1: planejamento e arquitetura
- [x] Entrega 1: setup do projeto
- [x] Entrega 2: layout e página inicial
- [x] Entrega 3: banco de dados (Supabase)
- [x] Entrega 4: galeria, página da obra e busca
- [x] Entrega 5: configurador de encomenda (telas)
- [ ] Entrega 6: envio do pedido (registro, fotos, e-mail, WhatsApp)
- [ ] Entrega 7: painel: login e pedidos
- [ ] Entrega 8: painel: obras
- [ ] Entrega 9: painel: catálogo, depoimentos, textos e configurações
- [ ] Entrega 10: qualidade (testes, acessibilidade, celulares reais)
- [ ] Entrega 11: publicação (Vercel, domínio, e-mail)

## Como rodar para conferir

Na pasta do projeto, no terminal:

```
npm install                      # primeira vez ou após atualizar
npx playwright install chromium  # primeira vez (testes)
npm run dev                      # abre em http://localhost:3000
```

Para abrir no celular (mesma rede Wi-Fi): com o `npm run dev` rodando, acesse `http://IP-DO-COMPUTADOR:3000` no navegador do celular. O IP aparece no terminal, na linha "Network".

---

## Fase 1: planejamento ✔

- [x] Plano de arquitetura, banco, fluxos, entregas e riscos (`arquitetura.md`)
- [x] Pendências comerciais registradas (`decisoes.md`)
- [x] Projeto Supabase de desenvolvimento criado (`croquis-dev`, São Paulo)
- [x] Repositório privado no GitHub: `lopeserick/croquis-e-flores`

## Entrega 1: setup ✔

**Entregue**
- [x] Projeto Next.js 16 + TypeScript + Tailwind
- [x] Cores e fontes da marca configuradas (só as cores da paleta podem ser usadas)
- [x] Ícone da aba do navegador (símbolo da logo)
- [x] Credenciais em `.env.local` (fora do git) e modelo documentado em `.env.example`
- [x] Testes automáticos configurados (unitários e de navegador)

**Como conferir**
- [x] `npm run dev` abre o site sem erro
- [x] A aba do navegador mostra o ícone da figura de croqui
- [x] `npm run lint`, `npm run typecheck` e `npm run build` terminam sem erro

## Entrega 2: layout e página inicial ✔

**Entregue**
- [x] Faixa rosa no topo: "Obras exclusivas, criadas especialmente para você"
- [x] Cabeçalho no computador: busca à esquerda, logo no centro, botão "Encomende já", menu embaixo com a página atual sublinhada
- [x] Cabeçalho no celular e tablet: fixo no topo, botão ☰, logo e "Encomende já" sempre visíveis
- [x] Menu do celular: busca, links, "Encomende já" e Instagram; fecha no X, no Esc ou tocando fora
- [x] Página inicial com as seções do protótipo: destaque, coleções, vitrine de obras, como funciona, "Sua ideia, nossa arte.", depoimentos, sobre a artista
- [x] Vitrine de obras com setas e arrasto com o dedo no celular
- [x] Rodapé com navegação, contatos, links institucionais e "Encomende já"
- [x] Páginas: Galeria, Galeria por coleção, Tipos de obra, Sobre a artista, Contato, Privacidade, Termos
- [x] Páginas "em construção" com caminho de volta: Encomendar (entrega 5) e página de cada obra (entrega 4)
- [x] Página "Página não encontrada" em português
- [x] Acessibilidade: foco visível, "Pular para o conteúdo", textos alternativos nas fotos, alvos de toque ≥ 44px, contraste aprovado na auditoria automática
- [x] Sem ícone de sacola; menu com "Tipos de obra" (decisões provisórias, ver `decisoes.md` item 10)

**Como conferir no navegador**
- [x] Abrir a página inicial e comparar com `design/home-referencia.html`
- [x] Estreitar a janela abaixo de ~1024px: o cabeçalho vira a versão compacta
- [x] No celular: tocar em ☰, ver o menu; fechar no X; a página atual aparece em rosa
- [x] Clicar em uma coleção (ex.: Retratos): abre a galeria só com retratos
- [x] Na vitrine "Obras que contam histórias": seta → avança, seta ← volta; no celular, arrastar
- [x] Menu "Como funciona": rola até a seção dos 3 passos
- [x] Buscar "croqui": vai para a galeria com o termo no endereço (o filtro chega na entrega 4)
- [x] Apertar Tab ao abrir a página: o primeiro item é "Pular para o conteúdo"; todo link mostra contorno ao receber foco
- [x] Digitar um endereço que não existe (ex.: `/teste`): aparece "Página não encontrada"
- [x] Depoimentos: aparecem com o selo "Conteúdo demonstrativo" em `npm run dev`; somem em `npm run build` + `npm start`
- [x] Rodapé e página Contato: WhatsApp abre conversa com (75) 98849-8356; e-mail abre croquiseflores@outlook.com; Instagram abre @croquiseflores

**Testes automáticos**
- [x] `npm test`: 21 testes de regras (menu, cards, depoimentos, links de contato)
- [x] `npm run test:e2e`: 49 testes no celular e no computador (seções, links, contatos do rodapé, menu, vitrine, busca, 404, sem rolagem lateral em 375/768/1280px, auditoria de acessibilidade em 7 páginas)

**Ainda não funciona (previsto para depois)**
- ~~Dados vêm de um arquivo de exemplo, não do banco~~ (feito na entrega 3)
- Busca e filtros da galeria (entrega 4)
- Página de cada obra (entrega 4)
- Formulário de encomenda (entregas 5 e 6)
- Textos da Carla, política e termos: aguardam informações (`decisoes.md`)

## Entrega 3: banco de dados ✔

**Entregue**
- [x] Banco no Supabase (projeto `croquis-dev`) com as tabelas do plano: modalidades, categorias, opções, obras, fotos, pedidos, referências, histórico, configurações, depoimentos, admins
- [x] O site agora lê tudo do banco: coleções, obras, modalidades, textos, contatos e depoimentos
- [x] Proteção no banco (RLS): o público só vê obras publicadas e catálogo ativo; pedidos e fotos de clientes ficam fechados
- [x] Dois locais de arquivos: `obras` (público, para a galeria) e `referencias` (privado, para as fotos dos clientes; só JPG, PNG e WebP até 10 MB)
- [x] Cadastro público de contas desligado (só a Carla terá acesso ao painel)
- [x] Dados provisórios (`supabase/seed.sql`): os mesmos da entrega 2, com nomes entre colchetes
- [x] Páginas em cache: abrem rápido e se atualizam sozinhas a cada hora (o painel vai atualizar na hora ao salvar)

**Como conferir no navegador**
- [x] `npm run dev`: a página inicial está igual à da entrega 2 (comparei as capturas de 6 páginas, no celular e no computador: idênticas)
- [x] No painel do Supabase (supabase.com > projeto croquis-dev > Table Editor): tabela `artworks` com 7 obras; mudar o título de uma e, após reiniciar o `npm run dev`, o novo título aparece na vitrine (depois volte o título original)
- [x] Ainda no painel: Storage mostra os buckets `obras` (Public) e `referencias` (sem a etiqueta Public)
- [x] Authentication (configurações de login): a opção de permitir cadastro de novos usuários ("Allow new users to sign up") está desligada

**Testes automáticos**
- [x] `npm test`: 27 testes de regras (inclui conversão dos dados do banco e validação das configurações)
- [x] `npm run test:db`: 25 testes no banco real
  - visitante não lê pedidos, rascunhos, configurações privadas nem fotos de clientes
  - visitante não cria pedido, não altera obras, não envia arquivos e não consegue criar conta
  - usuário logado que não é a Carla também não lê pedidos nem altera nada
  - regras: uma capa por obra, depoimento real só com autorização, referências só aceitam imagem
- [x] `npm run test:e2e`: 49 testes de navegador continuam passando

**Ainda não funciona (previsto para depois)**
- ~~Busca, filtros e página de cada obra~~ (feito na entrega 4)
- Formulário de encomenda e registro do pedido (entregas 5 e 6)
- Painel para a Carla editar tudo isso sem mexer no banco (entregas 7 a 9)
- Fotos das obras no armazenamento do Supabase: aguardam a autorização da Carla (`decisoes.md`, item 12)

## Entrega 4: galeria, página da obra e busca ✔

**Entregue**
- [x] Galeria com busca e filtros por coleção, modalidade e técnica, que podem ser combinados
- [x] Filtros ficam no endereço da página: dá para copiar o link e mandar no WhatsApp com o filtro aplicado
- [x] Busca ignora acentos e maiúsculas ("chapeu" encontra "chapéu") e procura em título, coleção, modalidade e técnica
- [x] Telas de carregamento, de "nenhuma obra encontrada" (com "Limpar filtros") e de erro ("Tentar de novo")
- [x] Página de cada obra: foto inteira, coleção, modalidade, técnica, história (quando houver), "Criar uma obra inspirada nesta" e "Mais obras"
- [x] Tipos de obra: imagem de cada modalidade, "Encomendar" e "Ver obras"
- [x] Prévia de link: ao colar o link de uma obra no WhatsApp aparece a foto da obra; nas demais páginas, uma imagem da marca
- [x] Para o Google: título e descrição por página, `/sitemap.xml` e `/robots.txt` (painel fora dos buscadores)

**Como conferir no navegador**
- [ ] Galeria: tocar em "Retratos" (coleção), depois em uma técnica; o endereço muda e a lista também
- [ ] Copiar o endereço filtrado, abrir em outra aba (ou mandar para si mesmo no WhatsApp): mesmo resultado
- [ ] Buscar "chapeu" (sem acento): aparece o croqui com chapéu
- [ ] Buscar "xyz": aparece "Nenhuma obra encontrada" e o botão "Limpar filtros"
- [ ] No celular, os filtros deslizam para o lado sem a página inteira sair da tela
- [ ] Abrir uma obra: foto inteira, detalhes, "Criar uma obra inspirada nesta" e "Mais obras" no fim
- [ ] Ver a prévia do link: abrir `http://localhost:3000/opengraph-image` mostra a imagem padrão (a prévia real no WhatsApp só funciona com o site publicado, entrega 11)
- [ ] Abrir `http://localhost:3000/sitemap.xml`: lista páginas, coleções e obras

**Testes automáticos**
- [ ] `npm test`: 40 testes de regras (inclui filtros, busca sem acento, endereço compartilhável, obras relacionadas)
- [ ] `npm run test:e2e`: 77 testes de navegador (inclui filtros, busca, sem resultados, página da obra, prévia de link, sitemap, acessibilidade em 9 páginas)

**Ainda não funciona (previsto para depois)**
- ~~"Criar uma obra inspirada nesta" leva a uma página em construção~~ (configurador pronto na entrega 5)
- Filtro por tamanho: as obras da galeria ainda não têm tamanho cadastrado (ver `decisoes.md`, item 13)
- Endereço de obra inexistente mostra "Página não encontrada", mas responde código 200 (limitação do Next com páginas pré-geradas; a página não é indexada)

## Entrega 5: configurador de encomenda ✔

**Entregue**
- [x] Formulário em 5 telas, com indicador de progresso: Obra → Detalhes → Inspiração → Seus dados → Revisão
- [x] Tela 1: modalidade (com foto e descrição) e tema (coleções + "Personalizado")
- [x] Tela 2: técnica, tamanho e entrega mudam conforme a modalidade (obra física pede moldura; digital pede formato do arquivo); "Outra técnica" e "Tamanho personalizado" abrem campo livre
- [x] Tela 3: fotos de referência com prévia e botão de remover (até 10 fotos de 10 MB; JPG, PNG ou WebP, conferindo o conteúdo real do arquivo), descrição e calendário (só datas a partir de amanhã, com o aviso de que a artista confirma a data)
- [x] Tela 4: nome, e-mail, WhatsApp (com máscara), cidade, estado, observações, aceite da política de privacidade e autorização opcional de portfólio
- [x] Tela 5: resumo de tudo, com "Editar" em cada bloco
- [x] Cada etapa avisa o que falta antes de seguir (lista no topo + mensagem em cada campo)
- [x] Rascunho guardado: recarregar a página ou abrir a câmera no celular não apaga o que foi preenchido (as fotos precisam ser escolhidas de novo, por segurança)
- [x] Botão "voltar" do celular volta uma etapa; "Recomeçar do zero" pede confirmação
- [x] "Criar uma obra inspirada nesta" (página da obra) e "Encomendar" (Tipos de obra) já chegam com as escolhas feitas
- [x] Opções (técnicas, tamanhos, molduras, formatos) e limites vêm do banco: provisórios, a Carla ajusta no painel (`decisoes.md`, item 13)

**Como conferir no navegador (de preferência no celular)**
- [ ] Abrir uma obra da galeria e tocar em "Criar uma obra inspirada nesta": a tela 1 já vem com a modalidade e o tema
- [ ] Tocar em "Continuar" sem escolher nada na tela 2: aparece a lista do que falta; tocar num item leva ao campo
- [ ] Escolher "Ilustração digital" na tela 1: na tela 2 aparece "Formato do arquivo" em vez de "Moldura"
- [ ] Na tela 3, adicionar 2 fotos, remover uma; tentar uma data de hoje (não deixa)
- [ ] Recarregar a página no meio: o que foi digitado continua lá
- [ ] Na tela 4, digitar o WhatsApp só com números: a máscara (11) 91234-5678 aparece sozinha
- [ ] Na revisão, tocar em "Editar" de um bloco, mudar algo e voltar: o resumo mostra a mudança
- [ ] "Solicitar orçamento" mostra que o envio ainda está em construção (chega na entrega 6)

**Testes automáticos**
- [ ] `npm test`: 64 testes de regras (inclui datas no fuso de São Paulo, WhatsApp, tipo real das fotos, regras de cada etapa, rascunho)
- [ ] `npm run test:e2e`: 93 testes de navegador (inclui o percurso completo no celular e no computador, foto falsa recusada, rascunho após recarregar, botão voltar, acessibilidade em cada etapa)
- [ ] `npm run test:db`: 25 testes no banco continuam passando

**Ainda não funciona (previsto para depois)**
- Enviar o pedido: registrar no banco, subir as fotos, e-mail para a Carla e link do WhatsApp (entrega 6)
- Textos reais das modalidades e da política de privacidade: aguardam a Carla (`decisoes.md`)
