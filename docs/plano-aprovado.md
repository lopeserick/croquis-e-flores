# Plano aprovado: andamento

Atualizado a cada entrega. Plano completo: `arquitetura.md`. Pendências e decisões: `decisoes.md`.

**Última atualização:** 11/11/2026, entrega 7.

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
- [x] Sem ícone de sacola; menu com "Tipos de obra" (ver `decisoes.md`, seção 2)

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
- Filtro por tamanho: as obras da galeria ainda não têm tamanho cadastrado (ver `decisoes.md`, seção 3)
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
- [x] Opções (técnicas, tamanhos, molduras, formatos) e limites vêm do banco: provisórios, a Carla ajusta no painel (`decisoes.md`, seção 3)

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

## Entrega 5.1: conteúdo real da Carla ✔

Fonte: `conteudo-carla.md`. Decisões: `decisoes.md`, seções 3 a 5.

**Entregue**
- [x] Coleções: Retratos, Casais, Pets, Desenho técnico de moda e Kit para colorir ("Momentos especiais" saiu). Coleção sem foto mostra o símbolo da marca
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
- [ ] Página inicial: 5 coleções (Pets e Kit com o símbolo), 5 passos em "Como funciona", 7 depoimentos e o texto da Carla no "Sobre"
- [ ] "Tipos de obra" (menu): preços de cada modalidade, coleções com preço próprio, prazos, pagamento e entrega
- [ ] Encomendar → Obra feita à mão → Continuar: escolher "Folha A4" faz aparecer Nanquim/Lápis de cor e a moldura; trocar para um quadro marca "Tinta acrílica" sozinha e some a moldura
- [ ] Ilustração digital: tamanho A4 já vem escolhido; o formato é PDF ou JPG; não pergunta entrega
- [ ] Na etapa 3, o calendário não deixa escolher data antes de 15 dias
- [ ] Revisão mostra os preços ao lado de tamanho, moldura e entrega

**Testes automáticos**
- [ ] `npm test`: 71 testes de regras (inclui dependência entre opções, forma de entrega e formato dos preços)
- [ ] `npm run test:db`: 28 testes no banco (inclui preços, dependências, PDF/JPG, prazo de 15 dias e depoimentos sem nome)
- [ ] `npm run test:e2e`: 101 testes de navegador (inclui a página de preços e o percurso com folha → quadro)

**Ainda depende da Carla** (`decisoes.md`)
- Em quais modalidades valem o Desenho técnico de moda (R$ 70) e o Kit para colorir (R$ 55)
- Fotos das obras, dela, de Pets e do Kit para colorir; nomes reais das obras
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
- [ ] Fazer uma encomenda completa com 1 ou 2 fotos: aparece "Recebemos o seu pedido!" com o número
- [ ] "Abrir conversa no WhatsApp" abre a conversa com a Carla e a mensagem com o número do pedido (não precisa enviar)
- [ ] No Supabase (Table Editor > `orders`), o pedido aparece; em `order_references`, as fotos; em Storage > `referencias`, os arquivos
- [ ] Voltar a "Encomendar" depois do envio: o formulário começa vazio
- [ ] Depois de conferir, apagar o pedido de teste no Supabase (as fotos ficam na pasta com a chave do pedido)

**Para receber o e-mail de verdade** (falta configurar)
- [ ] Criar conta em resend.com e gerar uma chave de API
- [ ] No `.env.local`: `RESEND_API_KEY=re_...`, `EMAIL_FROM="Croquis e Flores <onboarding@resend.dev>"` e `EMAIL_TO_OVERRIDE=` com o e-mail da conta do Resend (sem domínio verificado, ele só entrega para esse endereço)
- [x] Chave do Resend no `.env.local`, com os e-mails desviados para erick1lopes7@outlook.com (11/11/2026)
- [ ] Reiniciar o `npm run dev`, enviar um pedido e conferir a caixa de entrada (veja também o lixo eletrônico)
- Os testes automáticos não mandam e-mail. Para testar o envio real neles: `E2E_SEND_EMAIL=1 npm run test:e2e`

**Testes automáticos**
- [ ] `npm test`: 91 testes de regras (inclui link do WhatsApp, e-mail sem HTML injetado, falha do e-mail, caminho das fotos, chave do pedido, IP em hash)
- [ ] `npm run test:db`: 34 testes no banco (inclui número sequencial, pedido gravado numa vez, mesma chave sem duplicar, limite de tentativas, visitante sem acesso às funções)
- [ ] `npm run test:e2e`: 108 testes de navegador (inclui pedido com foto, duplo clique, foto falsa recusada pelo servidor, robô barrado, acessibilidade da tela de sucesso). Os pedidos de teste são apagados no fim

**Ainda não funciona (previsto para depois)**
- "Ver no painel" do e-mail: o painel chega na entrega 7
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
- [x] Mudar o status, registrar orçamento (R$) e prazo confirmado, fazer anotações internas e reenviar o e-mail de aviso. Tudo vai para o histórico do pedido
- [x] Botão "Sair"
- [x] Comando para criar a conta do painel e trocar senha: `npm run admin -- criar email "Nome"` (a senha é digitada no terminal, sem aparecer)

**Como conferir no navegador**
- [ ] No terminal, criar a sua conta: `npm run admin -- criar erick1lopes7@outlook.com "Erick"` e digitar uma senha de 12 caracteres ou mais
- [ ] Abrir `http://localhost:3000/admin` sem estar logado: vai para o login
- [ ] Entrar com a conta criada: aparece "Olá, Erick!" com a contagem de pedidos
- [ ] Fazer um pedido pelo site (com foto) e vê-lo no painel; abrir a foto
- [ ] Mudar o status, salvar um orçamento e uma anotação: tudo aparece no histórico
- [ ] "Sair" e tentar abrir o pedido de novo: volta para o login
- [ ] No celular: o painel funciona e os botões são fáceis de tocar

**Testes automáticos**
- [ ] `npm test`: 100 testes de regras (inclui valor em reais, datas no fuso de São Paulo, nomes dos status)
- [ ] `npm run test:db`: 37 testes no banco (inclui conta comum sem acesso aos pedidos e a Carla lendo, alterando e abrindo fotos só com a sessão dela)
- [ ] `npm run test:e2e`: 127 testes de navegador (inclui painel bloqueado sem login, conta sem acesso, foto sem login, percurso completo da Carla, filtros e acessibilidade)

**Ainda não funciona (previsto para depois)**
- "Esqueci minha senha" pelo e-mail (depois do domínio próprio)
- Cadastro de obras pelo painel (entrega 8); catálogo, textos e configurações (entrega 9)
- Rotina diária: reenviar e-mails que falharam e limpar fotos de pedidos não concluídos (entrega 10)
