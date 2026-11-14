# Plano aprovado: andamento

Atualizado a cada entrega. Plano completo: `arquitetura.md`. Pendências e decisões: `decisoes.md`.

**Última atualização:** 14/11/2026, entrega 10 e plano de testes (QA).

## Visão geral

- [x] Fase 1: planejamento e arquitetura
- [x] Entrega 1: setup do projeto
- [x] Entrega 2: layout e página inicial
- [x] Entrega 3: banco de dados (Supabase)
- [x] Entrega 4: galeria, página da obra e busca
- [x] Entrega 5: configurador de encomenda (telas)
- [x] Entrega 5.1: conteúdo real da Carla (coleções, preços, prazos, textos, depoimentos)
- [x] Entrega 6: envio do pedido (registro, fotos, e-mail, WhatsApp)
- [x] Entrega 7: painel: login e pedidos
- [x] Entrega 8: painel: obras
- [x] Entrega 9: painel: catálogo, depoimentos, textos e configurações
- [ ] Entrega 10: qualidade (testes, acessibilidade, celulares reais). Parte automática pronta; falta o roteiro manual do Plano de testes (QA), no fim deste arquivo
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
- [x] Sem ícone de sacola; menu com "Tipos de obra" (ver `decisoes.md`, seção 2)

**Como conferir no navegador**
- [x] Abrir a página inicial e comparar com `design/home-referencia.html`
- [x] Estreitar a janela abaixo de ~1024px: o cabeçalho vira a versão compacta
- [x] No celular: tocar em ☰, ver o menu; fechar no X; a página atual aparece em rosa
- [x] Clicar em uma coleção (ex.: Retratos): abre a galeria só com retratos
- [x] Na vitrine "Obras que contam histórias": seta → avança, seta ← volta; no celular, arrastar
- [x] Menu "Como funciona": rola até a seção dos 3 passos (hoje são 5, entrega 5.1)
- [x] Buscar "croqui": vai para a galeria com o termo no endereço (o filtro chega na entrega 4)
- [x] Apertar Tab ao abrir a página: o primeiro item é "Pular para o conteúdo"; todo link mostra contorno ao receber foco
- [x] Digitar um endereço que não existe (ex.: `/teste`): aparece "Página não encontrada"
- [x] Depoimentos: aparecem com o selo "Conteúdo demonstrativo" em `npm run dev`; somem em `npm run build` + `npm start` (hoje só há depoimentos reais, entrega 5.1)
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
- Fotos das obras no armazenamento do Supabase: aguardam a autorização da Carla (`decisoes.md`, seção 5)

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
- [x] Galeria: tocar em "Retratos" (coleção), depois em uma técnica; o endereço muda e a lista também
- [x] Copiar o endereço filtrado, abrir em outra aba (ou mandar para si mesmo no WhatsApp): mesmo resultado
- [x] Buscar "chapeu" (sem acento): aparece o croqui com chapéu
- [x] Buscar "xyz": aparece "Nenhuma obra encontrada" e o botão "Limpar filtros"
- [x] No celular, os filtros deslizam para o lado sem a página inteira sair da tela
- [x] Abrir uma obra: foto inteira, detalhes, "Criar uma obra inspirada nesta" e "Mais obras" no fim
- [x] Ver a prévia do link: abrir `http://localhost:3000/opengraph-image` mostra a imagem padrão (a prévia real no WhatsApp só funciona com o site publicado, entrega 11)
- [x] Abrir `http://localhost:3000/sitemap.xml`: lista páginas, coleções e obras

**Testes automáticos**
- [x] `npm test`: 40 testes de regras (inclui filtros, busca sem acento, endereço compartilhável, obras relacionadas)
- [x] `npm run test:e2e`: 77 testes de navegador (inclui filtros, busca, sem resultados, página da obra, prévia de link, sitemap, acessibilidade em 9 páginas)

**Ainda não funciona (previsto para depois)**
- ~~"Criar uma obra inspirada nesta" leva a uma página em construção~~ (configurador pronto na entrega 5)
- Filtro por tamanho: as obras da galeria ainda não têm tamanho cadastrado (ver `decisoes.md`, seção 3)
- Endereço de obra inexistente mostra "Página não encontrada", mas responde código 200 (limitação do Next com páginas pré-geradas; a página não é indexada)

## Entrega 5: configurador de encomenda ✔

**Entregue**
- [x] Formulário em 5 telas, com indicador de progresso: Obra → Detalhes → Inspiração → Seus dados → Revisão
- [x] Tela 1: modalidade (com foto e descrição) e tema (coleções + "Personalizado")
- [x] Tela 2: técnica, tamanho e entrega mudam conforme a modalidade (obra física pede moldura; digital pede formato do arquivo); "Outra técnica" e "Tamanho personalizado" abrem campo livre (retirados na entrega 5.1, com as opções reais)
- [x] Tela 3: fotos de referência com prévia e botão de remover (até 10 fotos de 10 MB; JPG, PNG ou WebP, conferindo o conteúdo real do arquivo), descrição e calendário (só datas a partir de amanhã, hoje 15 dias, com o aviso de que a artista confirma a data)
- [x] Tela 4: nome, e-mail, WhatsApp (com máscara), cidade, estado, observações, aceite da política de privacidade e autorização opcional de portfólio
- [x] Tela 5: resumo de tudo, com "Editar" em cada bloco
- [x] Cada etapa avisa o que falta antes de seguir (lista no topo + mensagem em cada campo)
- [x] Rascunho guardado: recarregar a página ou abrir a câmera no celular não apaga o que foi preenchido (as fotos precisam ser escolhidas de novo, por segurança)
- [x] Botão "voltar" do celular volta uma etapa; "Recomeçar do zero" pede confirmação
- [x] "Criar uma obra inspirada nesta" (página da obra) e "Encomendar" (Tipos de obra) já chegam com as escolhas feitas
- [x] Opções (técnicas, tamanhos, molduras, formatos) e limites vêm do banco: provisórios, a Carla ajusta no painel (`decisoes.md`, seção 3)

**Como conferir no navegador (de preferência no celular)**
- [x] Abrir uma obra da galeria e tocar em "Criar uma obra inspirada nesta": a tela 1 já vem com a modalidade e o tema
- [x] Tocar em "Continuar" sem escolher nada na tela 2: aparece a lista do que falta; tocar num item leva ao campo
- [x] Escolher "Ilustração digital" na tela 1: na tela 2 aparece "Formato do arquivo" em vez de "Moldura"
- [x] Na tela 3, adicionar 2 fotos, remover uma; tentar uma data de hoje (não deixa)
- [x] Recarregar a página no meio: o que foi digitado continua lá
- [x] Na tela 4, digitar o WhatsApp só com números: a máscara (11) 91234-5678 aparece sozinha
- [x] Na revisão, tocar em "Editar" de um bloco, mudar algo e voltar: o resumo mostra a mudança
- [x] "Solicitar orçamento" mostra que o envio ainda está em construção (o envio de verdade chegou na entrega 6)

**Testes automáticos**
- [x] `npm test`: 64 testes de regras (inclui datas no fuso de São Paulo, WhatsApp, tipo real das fotos, regras de cada etapa, rascunho)
- [x] `npm run test:e2e`: 93 testes de navegador (inclui o percurso completo no celular e no computador, foto falsa recusada, rascunho após recarregar, botão voltar, acessibilidade em cada etapa)
- [x] `npm run test:db`: 25 testes no banco continuam passando

**Ainda não funciona (previsto para depois)**
- Enviar o pedido: registrar no banco, subir as fotos, e-mail para a Carla e link do WhatsApp (entrega 6)
- Textos reais das modalidades e da política de privacidade: aguardam a Carla (`decisoes.md`)

## Entrega 5.1: conteúdo real da Carla ✔

Fonte: `conteudo-carla.md`. Decisões: `decisoes.md`, seções 3 a 5.

**Entregue**
- [x] Coleções: Retratos, Casais, Pets, Desenho técnico de moda e Kit para colorir ("Momentos especiais" saiu; o Kit saiu depois da entrega 7). Coleção sem foto mostra o símbolo da marca
- [x] Configurador com as opções reais:
  - **Obra feita à mão:** quadros de 10×15, 16×22 e 20×25 cm em acrílica, ou folha A4 em nanquim ou lápis de cor
  - **Ilustração digital:** A4, em PDF ou JPG
  - **Ilustração digital impressa:** A4, com moldura
- [x] Opções que dependem do tamanho: quadro só em acrílica (já vem escolhida); técnica e moldura da folha só aparecem com a folha A4
- [x] Nova pergunta para obra física: "Como você quer receber?" (retirada sem taxa, entrega em Feira de Santana por R$ 10, Correios com frete sob consulta)
- [x] Preços de referência no configurador, na revisão e na página "Tipos de obra e preços" (com prazos, pagamento e entrega)
- [x] Calendário só a partir de 15 dias
- [x] "Como funciona" com os 5 passos da Carla; "Sobre a artista" com o texto dela
- [x] 7 depoimentos reais da pesquisa, sem nome ("Cliente Croquis e Flores"), também no build de produção

**Como conferir no navegador**
- [x] Página inicial: 5 coleções (Pets e Kit com o símbolo; hoje 4, sem o Kit), 5 passos em "Como funciona", 7 depoimentos e o texto da Carla no "Sobre"
- [x] "Tipos de obra" (menu): preços de cada modalidade, coleções com preço próprio, prazos, pagamento e entrega
- [x] Encomendar → Obra feita à mão → Continuar: escolher "Folha A4" faz aparecer Nanquim/Lápis de cor e a moldura; trocar para um quadro marca "Tinta acrílica" sozinha e some a moldura
- [x] Ilustração digital: tamanho A4 já vem escolhido; o formato é PDF ou JPG; não pergunta entrega
- [x] Na etapa 3, o calendário não deixa escolher data antes de 15 dias
- [x] Revisão mostra os preços ao lado de tamanho, moldura e entrega

**Testes automáticos**
- [x] `npm test`: 71 testes de regras (inclui dependência entre opções, forma de entrega e formato dos preços)
- [x] `npm run test:db`: 28 testes no banco (inclui preços, dependências, PDF/JPG, prazo de 15 dias e depoimentos sem nome)
- [x] `npm run test:e2e`: 101 testes de navegador (inclui a página de preços e o percurso com folha → quadro)

**Ainda depende da Carla** (`decisoes.md`)
- Em quais modalidades valem o Desenho técnico de moda (R$ 70) e o Kit para colorir (R$ 55; Kit retirado)
- Fotos das obras, dela e de Pets; nomes reais das obras
- Confirmar a frase de inspiração do "Sobre" (escrita a partir do que ela contou)
- Nome nos depoimentos: só com a confirmação de cada cliente

## Entrega 6: envio do pedido ✔

Decisões: `decisoes.md`, seção 6.

**Entregue**
- [x] "Solicitar orçamento" envia de verdade:
  - as fotos sobem para o armazenamento privado;
  - o pedido é gravado com número `CF-2026-0001`;
  - a Carla recebe um e-mail.
- [x] O servidor confere tudo de novo (mesmas regras do formulário), inclusive se cada foto é mesmo uma imagem
- [x] Duplo clique ou reenvio depois de falha de rede não duplicam o pedido
- [x] Proteções: limite de tentativas por IP (guardado só como hash) e campo invisível contra robôs
- [x] E-mail "Nova solicitação" com escolhas, preços, data, descrição, contato do cliente e botões "Conversar no WhatsApp" e "Ver no painel". "Responder" vai direto para o cliente
- [x] Se o e-mail falhar (ou ainda não estiver configurado), o pedido continua gravado e a falha fica registrada para o painel
- [x] Tela de sucesso com o número do pedido e "Abrir conversa no WhatsApp" com mensagem pronta
- [x] Enquanto envia, o botão mostra "Enviando…" e o andamento ("Enviando foto 1 de 2…"); em caso de erro, os dados continuam no formulário

**Como conferir no navegador**
- [x] Fazer uma encomenda completa com 1 ou 2 fotos: aparece "Recebemos o seu pedido!" com o número
- [x] "Abrir conversa no WhatsApp" abre a conversa com a Carla e a mensagem com o número do pedido (não precisa enviar)
- [x] No Supabase (Table Editor > `orders`), o pedido aparece; em `order_references`, as fotos; em Storage > `referencias`, os arquivos
- [x] Voltar a "Encomendar" depois do envio: o formulário começa vazio
- [x] Depois de conferir, apagar o pedido de teste no Supabase (as fotos ficam na pasta com a chave do pedido)

**Para receber o e-mail de verdade** (configurado em 11/11/2026)
- [x] Criar conta em resend.com e gerar uma chave de API
- [x] No `.env.local`: `RESEND_API_KEY=re_...`, `EMAIL_FROM="Croquis e Flores <onboarding@resend.dev>"` e `EMAIL_TO_OVERRIDE=` com o e-mail da conta do Resend (sem domínio verificado, ele só entrega para esse endereço)
- [x] Chave do Resend no `.env.local`, com os e-mails desviados para erick1lopes7@outlook.com (11/11/2026)
- [x] Reiniciar o `npm run dev`, enviar um pedido e conferir a caixa de entrada (veja também o lixo eletrônico)
- Os testes automáticos não mandam e-mail. Para testar o envio real neles: `E2E_SEND_EMAIL=1 npm run test:e2e`

**Testes automáticos**
- [x] `npm test`: 91 testes de regras (inclui link do WhatsApp, e-mail sem HTML injetado, falha do e-mail, caminho das fotos, chave do pedido, IP em hash)
- [x] `npm run test:db`: 34 testes no banco (inclui número sequencial, pedido gravado numa vez, mesma chave sem duplicar, limite de tentativas, visitante sem acesso às funções)
- [x] `npm run test:e2e`: 108 testes de navegador (inclui pedido com foto, duplo clique, foto falsa recusada pelo servidor, robô barrado, acessibilidade da tela de sucesso). Os pedidos de teste são apagados no fim

**Ainda não funciona (previsto para depois)**
- ~~"Ver no painel" do e-mail: o painel chega na entrega 7~~ (feito na entrega 7)
- Reenvio de e-mails que falharam e limpeza de fotos de pedidos não concluídos (rotina diária, junto com o painel)
- E-mail de confirmação para o cliente (depende do domínio verificado, entrega 11)

## Entrega 7: painel (login e pedidos) ✔

**Entregue**
- [x] Login do painel em `/admin/login`, com mensagem que não revela se o e-mail existe e limite de tentativas
- [x] Painel protegido de verdade: sem login, toda página do painel leva ao login. Conta que não é da Carla não entra. As fotos dos clientes também não abrem por chamada direta
- [x] Início do painel: pedidos novos, contagem por status, aviso de e-mails que não saíram e pedidos recentes
- [x] Lista de pedidos com filtro por status
- [x] Página do pedido:
  - escolhas, data desejada, descrição e obra de inspiração;
  - fotos do cliente (abrem em tamanho real ou para baixar, por link que vale 1 minuto);
  - contato, com botões de WhatsApp e e-mail.
- [x] Mudar o status (Novo, Orçamento enviado, Aprovado (em produção), Concluído, Cancelado), registrar orçamento (R$) e prazo confirmado, fazer anotações internas e reenviar o e-mail de aviso. Tudo vai para o histórico do pedido
- [x] Botão "Sair"
- [x] Comando para criar a conta do painel e trocar senha: `npm run admin -- criar email "Nome"` (a senha é digitada no terminal, sem aparecer)

**Como conferir no navegador**
- [x] No terminal, criar a sua conta: `npm run admin -- criar erick1lopes7@outlook.com "Erick"` e digitar uma senha de 12 caracteres ou mais
- [x] Abrir `http://localhost:3000/admin` sem estar logado: vai para o login
- [x] Entrar com a conta criada: aparece "Olá, Erick!" com a contagem de pedidos
- [x] Fazer um pedido pelo site (com foto) e vê-lo no painel; abrir a foto
- [x] Mudar o status, salvar um orçamento e uma anotação: tudo aparece no histórico
- [x] "Sair" e tentar abrir o pedido de novo: volta para o login
- [x] No celular: o painel funciona e os botões são fáceis de tocar

**Testes automáticos**
- [x] `npm test`: 100 testes de regras (inclui valor em reais, datas no fuso de São Paulo, nomes dos status)
- [x] `npm run test:db`: 37 testes no banco (inclui conta comum sem acesso aos pedidos e a Carla lendo, alterando e abrindo fotos só com a sessão dela)
- [x] `npm run test:e2e`: 127 testes de navegador (inclui painel bloqueado sem login, conta sem acesso, foto sem login, percurso completo da Carla, filtros e acessibilidade)

**Ainda não funciona (previsto para depois)**
- "Esqueci minha senha" pelo e-mail (depois do domínio próprio)
- ~~Cadastro de obras pelo painel (entrega 8); catálogo, textos e configurações (entrega 9)~~ (feito)
- Rotina diária: reenviar e-mails que falharam e limpar fotos de pedidos não concluídos (entrega 10)

## Ajustes pedidos depois da entrega 7 ✔

**Entregue**
- [x] Status dos pedidos simplificados: **Novo, Orçamento enviado, Aprovado (em produção), Concluído e Cancelado**. Pedidos que já existiam foram convertidos para o status mais próximo
- [x] Coleção **Kit para colorir** retirada do site (página inicial, galeria, encomenda e preços); o endereço antigo mostra "Página não encontrada"
- [x] Mensagens prontas do WhatsApp mais carinhosas, com emojis:
  - botão de WhatsApp do site (rodapé e Contato);
  - cliente para a Carla, depois de enviar o pedido;
  - Carla para o cliente, no painel e no e-mail do pedido.
- [x] Depoimentos em **carrossel**: um por vez, com aspas grandes, setas que dão a volta, bolinhas no computador e "1 de 7" no celular. Dá para arrastar com o dedo e passar pelo teclado

**Como conferir no navegador**
- [x] Painel: o filtro e a página do pedido mostram os 5 status novos
- [x] Página inicial: não aparece mais o Kit para colorir; `/galeria/kit-para-colorir` mostra "Página não encontrada"
- [x] Rodapé > WhatsApp: a conversa abre com "Oi, Carla! 🌸 Vim pelo site…"
- [x] Depoimentos: passar com as setas e, no celular, arrastando com o dedo

**Testes automáticos**
- [x] `npm test`: 101 · `npm run test:db`: 37 · `npm run test:e2e`: 129 (inclui o carrossel, a coleção retirada e a mensagem do WhatsApp)

## Entrega 8: painel de obras ✔

**Entregue**
- [x] Menu do painel com Obras, Catálogo, Depoimentos, Textos e Configurações
- [x] Lista de obras com foto, coleção, situação (Publicada, Rascunho, Arquivada), destaque e filtro
- [x] Nova obra: nome, coleção, modalidade, técnica (com sugestões), dimensões, descrição, história, endereço da página e "Destaque na página inicial". Começa como rascunho
- [x] Fotos: enviar várias de uma vez (até do celular), descrição de cada uma, ponto de foco com prévia do corte, escolher a capa, mudar a ordem e apagar
  - o navegador diminui a foto (até 2400 px) e apaga os dados da câmera antes de enviar;
  - o servidor confere se é mesmo uma imagem.
- [x] Publicar (só com foto de capa descrita e sem nome entre colchetes), voltar para rascunho, arquivar e apagar de vez (pede para digitar "apagar")
- [x] Ordem das obras na galeria: setas subir/descer na lista
- [x] Ao salvar, o site muda na hora (galeria, página da obra, vitrine da página inicial)

**Como conferir no navegador**
- [x] Painel > Obras > **Nova obra**: preencher, "Criar obra"
- [x] Na obra criada, "Adicionar fotos" (pode ser foto do celular), escrever a descrição e tocar na parte mais importante da foto
- [x] "Publicar": a obra aparece na galeria e em "Ver no site"
- [x] Marcar "Destaque na página inicial", salvar: aparece na vitrine "Obras que contam histórias"
- [x] "Arquivar": some do site e continua na lista do painel
- [x] Apagar a obra de teste no fim ("Apagar a obra de vez")

**Testes automáticos**
- [x] `npm test`: regras de publicação, capa, caminho das fotos, redução de tamanho, ordem e endereço
- [x] `npm run test:db`: a Carla envia foto para a galeria por link assinado; conta comum não consegue
- [x] `npm run test:e2e` (projeto "painel"): cadastrar com foto, publicar e ver na galeria, arquivar e sumir, apagar e as fotos saírem do armazenamento; obra publicada não fica sem foto; endereço repetido recusado

## Entrega 9: painel de catálogo, depoimentos, textos e configurações ✔

**Entregue**
- [x] **Catálogo:** modalidades (nome, descrição, foto, ativa) e as opções de cada uma, por grupo: tamanhos, técnicas, molduras, formatos e entrega
  - preço, descrição, "só aparece quando o cliente escolher…" (ex.: Nanquim só com Folha A4), ativa e ordem;
  - nova modalidade e nova opção.
- [x] **Coleções:** nome, frase, preço próprio, foto, em quais modalidades pode ser encomendada, mostrar na página inicial, ativa, ordem e nova coleção
- [x] **Depoimentos:** novo, editar, ordem do carrossel, publicar (só com a autorização anotada) e apagar
- [x] **Textos:** faixa do topo, rodapé, destaque da página inicial (com foto), "Sua ideia, nossa arte.", "Como funciona" (adicionar e tirar passos), "Sobre" (com foto), prazos e pagamento, política de privacidade e termos de uso
- [x] Política e termos agora vêm do painel; vazios, as páginas mostram que o texto está pendente. Mudou a política: os próximos pedidos guardam a nova versão
- [x] **Configurações:** WhatsApp, e-mail e Instagram do site, e-mail que recebe os pedidos, prazo mínimo da data desejada, limite de fotos e a pergunta do portfólio
- [x] Cada campo avisa o erro (preço inválido, WhatsApp incompleto, passo vazio…) e leva o foco até ele; o que foi digitado não se perde

**Como conferir no navegador**
- [x] Catálogo > Obra feita à mão > Nanquim > desmarcar "Ativa" > Salvar: em Encomendar, com Folha A4, só aparece Lápis de cor. Depois, marcar "Ativa" de novo
- [x] Mudar o preço de um tamanho: o novo valor aparece em "Tipos de obra e preços"
- [x] Configurações > WhatsApp: trocar o número e salvar; o botão do rodapé abre o novo número. Depois, voltar para (75) 98849-8356
- [x] Textos > Faixa do topo: mudar e ver no site; depois voltar o texto
- [x] Depoimentos > Novo: tentar publicar sem a autorização (não deixa); com a autorização, aparece no carrossel. Apagar no fim
- [x] No celular: as telas do painel funcionam e os botões são fáceis de tocar

**Testes automáticos**
- [x] `npm test`: 128 testes de regras (inclui preços, dependência entre opções, autorização do depoimento, WhatsApp, passos, limites do formulário, versão da política)
- [x] `npm run test:db`: 40 testes no banco (inclui a Carla editando catálogo, depoimentos e configurações; textos legais públicos)
- [x] `npm run test:e2e`: 152 testes de navegador (inclui painel bloqueado sem login nas páginas novas, desativar técnica e sumir do configurador, mudar o WhatsApp e o link mudar, textos, termos, coleção nova na página inicial, depoimento com autorização e acessibilidade das telas do painel). Os testes que mudam o conteúdo devolvem tudo como estava

**Ainda não funciona (previsto para depois)**
- ~~Foto enviada e não salva fica esquecida no armazenamento~~ (a rotina diária apaga, entrega 10)
- Apagar modalidade, coleção ou opção: por segurança, só dá para desativar (pedidos e obras antigos continuam apontando para elas)

## Entrega 10: qualidade (parte automática ✔, falta o roteiro manual)

**Entregue**
- [x] **Revisão da estrutura do código:** leituras de depoimentos e configurações separadas das do catálogo; valores em reais e datas num lugar só; peças repetidas do painel e dos testes juntadas. Nada muda para quem usa
- [x] **Rotina diária automática** (todo dia às 6h de Brasília, depois da publicação):
  - reenvia o e-mail de pedidos cujo aviso falhou (até 3 tentativas, pedidos de até 7 dias);
  - apaga fotos de clientes que desistiram no meio do envio (depois de 24 h);
  - apaga fotos enviadas no painel e não usadas (ex.: trocou a foto e não salvou);
  - apaga as fotos de referência de pedidos concluídos ou cancelados depois do prazo escolhido pela Carla;
  - mantém o banco gratuito ativo (ele pausa depois de 7 dias sem uso).
- [x] A rotina só roda com a chave secreta (`CRON_SECRET`) e responde só com contagens, sem dados de clientes
- [x] **Painel > Configurações > Fotos dos clientes:** prazo para apagar as fotos de referência. Começa vazio (não apaga nada) até a Carla decidir (`decisoes.md`, seção 6)
- [x] Testes que não dependem de quantas obras, coleções ou depoimentos existem: a Carla pode cadastrar à vontade sem quebrar os testes
- [x] Auditoria de acessibilidade em todas as telas do painel, no celular e no computador, e nas páginas de política e termos

**Como conferir**
- [ ] Painel > Configurações > Fotos dos clientes: escrever 0 e salvar (não deixa); escrever 180 e salvar; depois apagar o número e salvar de novo
- [ ] Rodar a rotina à mão, com o `npm run dev` aberto (o valor do `CRON_SECRET` está no `.env.local`):
  `curl -H "Authorization: Bearer VALOR_DO_CRON_SECRET" http://localhost:3000/api/cron/manutencao`
  Resposta esperada: contagens como `{"emailsTentados":0,...}`, sem nenhum `erro_`
- [ ] Sem a chave, `http://localhost:3000/api/cron/manutencao` responde "Acesso negado"
- [ ] Seguir o **Plano de testes (QA)** abaixo, nos celulares reais

**Testes automáticos**
- [x] `npm test`: 139 testes de regras (inclui quem pode rodar a rotina, quando reenviar e-mail, quando um arquivo é considerado esquecido, prazo de retenção)
- [x] `npm run test:db`: 45 testes no banco (inclui apagar a pasta de um envio abandonado e não a de um pedido, apagar foto sem uso e manter a usada, retenção desligada e ligada, parar o reenvio depois de 3 falhas)
- [x] `npm run test:e2e`: 160 testes de navegador (inclui a rotina recusando quem não tem a chave, a rotina rodando sem erros e o painel inteiro auditado no celular)

**Desempenho medido** (build de produção, celular simulado)
| Página | Primeiro conteúdo | Conteúdo principal | Página pula ao carregar? | Código (JS) | Fotos | Fontes |
|---|---|---|---|---|---|---|
| Início | 1,1 s | 1,1 s | não | 202 KB | 187 KB | 130 KB |
| Galeria | 1,0 s | 1,0 s | não | 208 KB | 70 KB | 130 KB |
| Página da obra | 1,0 s | 1,7 s | não | 208 KB | 78 KB | 130 KB |
| Encomendar | 0,9 s | 0,9 s | não | 202 KB | 30 KB | 130 KB |

Simulação de celular com 4G lento e processador 4 vezes mais lento (o mesmo perfil do PageSpeed). O Google considera **bom** o conteúdo principal em até 2,5 s: todas as páginas ficaram abaixo disso. Ainda dá para diminuir as fontes (130 KB), se a nota do PageSpeed pedir.

**Ainda depende de alguém**
- Teste em iPhone e Android de verdade: roteiro na seção D do plano de testes
- Prazo de retenção das fotos dos clientes: decisão da Carla
- Nota do PageSpeed só faz sentido com o site publicado (entrega 11)

---

## Plano de testes (QA)

Roteiro para conferir o site inteiro **antes de publicar** (entrega 11) e depois de cada mudança grande. Escrito para quem não programa: basta seguir os passos e marcar.

### Como usar

- Marque **[x]** no que funcionou. Se algo der errado, anote na tabela **Problemas encontrados**, no fim: data, aparelho, onde estava e o que aconteceu (uma foto da tela ajuda muito).
- Aparelhos mínimos:
  - **iPhone** com Safari;
  - **Android** com Chrome;
  - **computador** com Chrome ou Edge.
- Use o site rodando no computador (`npm run dev`) e, no celular, o endereço `http://IP-DO-COMPUTADOR:3000`; ou o site publicado na Vercel (entrega 11).
- Os pedidos de teste devem usar um nome que comece com **"Teste"**, para depois achar e apagar.
- **Problema bloqueante** é o que impede o cliente de encomendar ou a Carla de ver o pedido, ou o que expõe dados de alguém. Esse precisa ser resolvido antes de publicar.

### A. Testes automáticos (o Erick ou o Claude rodam)

| Comando | O que confere | Resultado esperado |
|---|---|---|
| `npm run lint` e `npm run typecheck` | Erros de código | Sem erros |
| `npm test` | Regras: preços, validação do pedido, datas, WhatsApp, e-mail, painel, rotina diária | Todos passam |
| `npm run test:db` | Banco: quem pode ler e alterar o quê, fotos privadas, pedido sem duplicar, rotina diária | Todos passam |
| `CI=1 npm run test:e2e` | Navegador no celular e no computador, com o build de produção: páginas, encomenda completa, painel inteiro, acessibilidade | Todos passam (os "pulados" são de propósito: só valem no celular ou só no computador) |
| `npm run build` | O site monta para publicar | Sem erros |

- [ ] Todos os comandos acima passaram na versão que vai ser publicada

### B. Visitante: navegação (celular e computador)

- [ ] Página inicial abre rápido; a faixa rosa, a logo e o "Encomende já" aparecem
- [ ] Menu ☰ (celular): abre, navega, fecha no X, no Esc e tocando fora
- [ ] Cada coleção da página inicial abre a galeria só com aquela coleção
- [ ] Vitrine "Obras que contam histórias": setas e arrastar com o dedo
- [ ] "Como funciona" mostra os passos; o link do menu rola até a seção
- [ ] Depoimentos: passar pelas setas, pelas bolinhas (computador) e arrastando (celular)
- [ ] Galeria: filtros de coleção, modalidade e técnica; combinar dois filtros; "Limpar filtros"
- [ ] Busca "chapeu" (sem acento) acha "chapéu"; busca sem resultado mostra a mensagem
- [ ] Copiar o endereço de uma galeria filtrada e abrir em outra aba: mesmo resultado
- [ ] Página de uma obra: foto inteira, detalhes, "Criar uma obra inspirada nesta", "Mais obras"
- [ ] Tipos de obra e preços: preços conferem com o que a Carla passou; prazos, pagamento e entrega
- [ ] Sobre, Contato, Política de privacidade e Termos de uso abrem e têm o texto certo
- [ ] Rodapé: WhatsApp (mensagem com os emojis certos), Instagram e e-mail abrem o lugar certo
- [ ] Endereço que não existe (ex.: `/teste`) mostra "Página não encontrada"
- [ ] Nenhuma página "rola para o lado" no celular, de pé e deitado

### C. Encomenda completa (o fluxo mais importante)

Fazer **uma encomenda de cada modalidade**: obra feita à mão (quadro e folha A4), ilustração digital e ilustração digital impressa.

- [ ] Tela 1: escolher modalidade e tema; "Personalizado" também funciona
- [ ] Tela 2: só aparecem as opções daquela modalidade; quadro marca "Tinta acrílica" sozinho; folha A4 pede técnica e moldura; digital pede o formato
- [ ] "Continuar" sem escolher mostra o que falta e leva até o campo
- [ ] Tela 3: adicionar fotos **da galeria do celular** e **tiradas na hora com a câmera**; remover uma; foto acima do limite é recusada com aviso
- [ ] Calendário não deixa escolher data antes do prazo mínimo
- [ ] Recarregar a página no meio (e abrir a câmera): o que foi digitado continua
- [ ] Botão "voltar" do celular volta uma etapa
- [ ] Tela 4: WhatsApp ganha a máscara sozinho; e-mail inválido é recusado; sem aceitar a política não continua
- [ ] Tela 5: resumo com preços; "Editar" de cada bloco funciona
- [ ] "Solicitar orçamento": aparece "Enviando foto 1 de 2…" e depois "Recebemos o seu pedido!" com o número
- [ ] Tocar duas vezes rápido em "Solicitar orçamento" não cria dois pedidos
- [ ] "Abrir conversa no WhatsApp": abre a conversa com a Carla e a mensagem pronta, **com os emojis certos** (🌸 ✨ 💛)
- [ ] O e-mail "Nova solicitação" chegou (olhar também o lixo eletrônico), com os dados, as escolhas e os botões "Conversar no WhatsApp" e "Ver no painel"
- [ ] "Responder" no e-mail vai para o e-mail do cliente
- [ ] Sem internet no meio do envio (modo avião): aparece um aviso e os dados continuam no formulário; com a internet de volta, o envio funciona sem duplicar

### D. Celulares reais (o que só aparece em aparelho de verdade)

**iPhone (Safari)**
- [ ] Ao tocar num campo, a tela **não** dá zoom sozinha
- [ ] Foto tirada com a câmera do iPhone é aceita na encomenda e no painel
- [ ] Teclado numérico aparece no campo de WhatsApp e nos preços do painel
- [ ] O menu e as telas não ficam escondidos atrás da barra de endereço ou do recorte da câmera
- [ ] O calendário da data desejada abre e funciona

**Android (Chrome)**
- [ ] Mesmos itens do iPhone (zoom, câmera, teclado numérico, calendário)
- [ ] Botão "voltar" do sistema volta uma etapa da encomenda, sem sair do site

**Nos dois**
- [ ] Todos os botões são fáceis de tocar com o polegar (nenhum toque "pega" o botão vizinho)
- [ ] Textos legíveis sem precisar dar zoom; nada cortado
- [ ] Testar também com a internet do celular (4G), não só no Wi-Fi

### E. Painel da Carla (de preferência no celular dela)

- [ ] Login com a conta da Carla; senha errada mostra mensagem; "Sair" funciona
- [ ] **Pedidos:** o pedido de teste aparece; fotos abrem e baixam; o WhatsApp do cliente abre com a mensagem pronta e os emojis certos
- [ ] Mudar status, registrar orçamento e prazo, fazer uma anotação: tudo aparece no histórico
- [ ] **Obras:** criar uma obra, enviar foto do celular, escrever a descrição, marcar o ponto de foco, publicar, ver no site, arquivar, apagar
- [ ] **Catálogo:** mudar um preço e ver em "Tipos de obra"; desativar uma opção e ver que some da encomenda; reativar
- [ ] **Coleções:** trocar a foto de uma coleção e ver na página inicial
- [ ] **Depoimentos:** criar, tentar publicar sem a autorização (não deixa), publicar com a autorização, ver no carrossel, apagar
- [ ] **Textos:** mudar a faixa do topo e um passo do "Como funciona"; ver no site; voltar ao texto original
- [ ] **Configurações:** conferir WhatsApp, e-mail, Instagram, e-mail dos pedidos, prazo mínimo, limite de fotos e prazo das fotos dos clientes
- [ ] A Carla consegue fazer tudo isso **sozinha** (se travar em algum ponto, anotar: vira melhoria ou entra no manual do painel)

### F. Acessibilidade (à mão; a auditoria automática não pega tudo)

- [ ] Só com o teclado (Tab, Shift+Tab, Enter, setas, Esc): dá para navegar, fazer uma encomenda inteira e usar o painel; o contorno do foco aparece sempre
- [ ] O primeiro Tab da página mostra "Pular para o conteúdo"
- [ ] Leitor de tela (VoiceOver no iPhone ou TalkBack no Android): a página inicial e a encomenda são lidas na ordem certa; fotos têm descrição; erros dos formulários são lidos
- [ ] Zoom do navegador em 200%: nada se sobrepõe nem some
- [ ] Letra grande no celular (configuração do aparelho): textos continuam legíveis

### G. Segurança e privacidade

- [ ] Sem login, qualquer endereço `/admin/...` leva ao login
- [ ] Uma conta que não é da Carla não entra no painel
- [ ] O endereço de uma foto de cliente copiado do painel **não abre** numa janela anônima (sem login)
- [ ] Fotos dos clientes nunca aparecem na galeria nem na busca
- [ ] Muitos pedidos seguidos do mesmo aparelho são barrados com aviso (limite por hora)
- [ ] `/api/cron/manutencao` sem a chave responde "Acesso negado"
- [ ] Senhas e chaves não estão no GitHub (o `.env.local` não aparece no repositório)
- [ ] A chave do Resend que apareceu na conversa foi **trocada** por uma nova antes de publicar

### H. Depois de publicar (entrega 11)

- [ ] Pedido real de ponta a ponta no endereço definitivo, com o e-mail chegando para a **Carla**
- [ ] Prévia do link no WhatsApp e no Instagram: página inicial e uma obra mostram a foto certa
- [ ] PageSpeed Insights (pagespeed.web.dev), página inicial e galeria, no celular: nota 90 ou mais em Desempenho, Acessibilidade e Boas práticas
- [ ] A rotina diária rodou (Vercel > projeto > Cron Jobs mostra a última execução sem erro)
- [ ] Google: `/sitemap.xml` enviado no Search Console (opcional)

### Critério para publicar

- [ ] Seção A toda verde
- [ ] Seções B a G sem nenhum problema bloqueante em aberto
- [ ] Pendências que impedem publicar, resolvidas (`decisoes.md`): autorização e fotos da Carla, texto da política de privacidade, domínio, em nome de quem ficam as contas, e-mail que recebe os pedidos

### Problemas encontrados

| Data | Aparelho | Onde | O que aconteceu | Bloqueante? | Situação |
|---|---|---|---|---|---|
| | | | | | |
