# Decisões e pendências

Registro do que foi decidido antes do desenvolvimento. **Em conflito com o briefing, este arquivo vale.** Informações comerciais e textos reais da Carla: `conteudo-carla.md`.

## Decisões tomadas

1. **Nome e marca**: o ateliê se chama **Croquis e Flores**. A artista é a **Carla** (Instagram @croquiseflores; bio: "meus croquis, minhas flores e eu").
2. **Paleta**: trocamos a paleta bege/grafite do briefing por **laranja e rosa** (ver `identidade-visual.md`). Motivo: combina com a identidade que a Carla já usa nos posts.
3. **Referências de navegação**: estrutura inspirada em Vivara e Pandora, aprovada no protótipo `design/home-referencia.html`.
4. **Logo**: escolhida a **opção 3 (Silhueta de croqui)**. Os SVGs atuais são **provisórios**; a ideia é a Carla redesenhar à mão e vetorizar.
5. **Categorias no protótipo**: o briefing cita Paisagens, Retratos, Pets e Momentos especiais, mas o portfólio real da Carla é de **croquis de moda, retratos digitais, casais e técnica mista**. O protótipo usa: **Croquis de moda, Retratos, Casais e Momentos especiais**. As categorias devem ser **administráveis no painel** (nada fixo no código). *Substituída pela decisão 14.*
6. **Placeholders**: nomes de obras, descrições, depoimentos, biografia e e-mail aparecem entre colchetes no protótipo. Nenhum dado fictício deve ir para produção como se fosse real.
7. **Fotos do protótipo**: capturadas do Instagram em ~760px. Na ilustração do casal digital foram **removidos** ícones e uma citação de uma série de TV, para não exibir elementos de obras de terceiros na vitrine.
8. **Sem pagamento online** na primeira versão (fluxo de orçamento), conforme o briefing.
9. **Plano da Fase 1 aprovado** em 10/11/2026 (`arquitetura.md`). Andamento das entregas em `plano-aprovado.md`.
10. **Adotado provisoriamente na entrega 2** (sem resposta explícita; fácil de reverter):
    - **Sem ícone de sacola** no cabeçalho (não há carrinho nem conta de cliente).
    - **"Obra feita à mão"** no lugar de "Pintura física" e **"Tipos de obra"** no menu, no lugar de "Tipos de pintura". Nomes ficam editáveis no painel (entrega 9).
    - **Depoimentos de exemplo** só aparecem em desenvolvimento; no build de produção a seção some até existir depoimento real.
    - **Contatos não informados** aparecem como `[pendência]` sem link, em vez de um botão que não funciona.
11. **Contatos do ateliê** (informados em 10/11/2026): WhatsApp **(75) 98849-8356** (`5575988498356`) e e-mail **croquiseflores@outlook.com**. Editáveis no painel (entrega 9).
12. **Adotado provisoriamente na entrega 3** (fácil de mudar pelo painel):
    - **Fotos do seed ficam em `/public/demo/obras`**, não no bucket `obras`. Só sobem para o armazenamento quando a Carla autorizar o uso (pendência abaixo).
    - **Toda categoria aparece como "tipo de arte" em todas as modalidades** até a Carla definir o que oferece em cada uma.
    - **Cadastro público desligado** no Supabase e senha mínima de 12 caracteres para o painel.
13. **Adotado provisoriamente nas entregas 4 e 5**:
    - **Filtro de técnica da galeria** usa a técnica escrita em cada obra. **Filtro por tamanho** fica de fora até as obras terem tamanho cadastrado (o briefing pede "quando aplicável").
    - **Opções do configurador** (técnicas, tamanhos, moldura, formatos de arquivo) vêm das listas do briefing (seção 6) mais as técnicas vistas no portfólio da Carla (nanquim, lápis, giz pastel, técnica mista). Ela confirma e ajusta no painel (entrega 9). *Substituída pela decisão 14.*
    - **Data desejada obrigatória**, a partir de amanhã (`minLeadDays` = 1, configurável). **Fotos de referência opcionais**: até 10 imagens de 10 MB (JPG, PNG ou WebP). *Prazo substituído pela decisão 14 (15 dias).*
    - **Autorização de portfólio**: caixa opcional, desmarcada, ligada por configuração (`askPortfolioConsent`).
    - **"Personalizado"** como tipo de arte em toda modalidade, para pedidos que não se encaixam numa coleção.
14. **Conteúdo real informado pela Carla em 10/11/2026** (detalhes em `conteudo-carla.md`; tudo editável no painel):
    - **Coleções**: Retratos, Casais, Pets, Desenho técnico de moda e Kit para colorir. Saem "Momentos especiais" e caneca.
    - **Modalidades, técnicas e tamanhos**: feita à mão (quadros em acrílica 10×15, 16×22 e 20×25 cm; folha A4 em nanquim ou lápis de cor), ilustração digital (A4) e ilustração digital impressa (A4, com moldura). Um tipo de moldura só (porta-retrato).
    - **Preços aparecem no site**, como "a partir de"; personalizações seguem no fluxo de orçamento.
    - **Prazo**: calendário a partir de 15 dias (`minLeadDays` = 15); entrega em até 15 dias corridos após o sinal.
    - **Pagamento** (só informativo, fora do site): Pix, transferência, depósito ou boleto; 50% no início e 50% na entrega. Sem cartão.
    - **Entrega**: retirada sem taxa (Brasília ou Fraga Maia, Feira de Santana), entrega local por R$ 10 dentro do Anel de Contorno, Correios para todo o Brasil com frete sob consulta.
    - **Textos**: apresentação da seção Sobre e os 5 passos de "Como funciona" são os da Carla.
    - **Domínio desejado**: croquiseflores.com.br.

## Pendências com a Carla (bloqueiam a publicação, não o desenvolvimento)

Implementar como **configuração editável** com valor provisório:

- [ ] Autorização para usar as fotos das obras e a foto dela no site (ela vai mandar pelo WhatsApp, junto com as fotos).
- [ ] Arquivos originais das obras em alta resolução (8 a 12 obras cobrindo cada serviço, mais fotos no ambiente).
- [x] Categorias reais e se faz pinturas físicas (decisão 14: quadros em acrílica).
- [x] Modalidades oferecidas (decisão 14: as três).
- [ ] Técnicas e tamanhos: definidos (decisão 14). **Falta: formatos de arquivo da ilustração digital.**
- [x] Emolduramento e entregas (decisão 14).
- [x] Número do WhatsApp e e-mail de contato (decisão 11). Confirmar se os pedidos também chegam nesse e-mail.
- [x] Prazo mínimo para o calendário: 15 dias (decisão 14).
- [ ] Limite de tamanho e quantidade de imagens de referência por pedido.
- [x] Textos da seção "Sobre a artista" (apresentação e inspiração em `conteudo-carla.md`).
- [ ] Depoimentos reais com autorização: os textos existem, mas a pesquisa foi **anônima** e os nomes foram distribuídos sem saber quem escreveu cada frase. Decidir antes de publicar: confirmar com cada cliente a sua frase ou exibir sem nome.
- [ ] Texto da política de privacidade (LGPD) e dos termos de uso.
- [ ] Domínio do site: croquiseflores.com.br escolhido; falta conferir disponibilidade e registrar.
- [ ] Versão final da logo desenhada por ela.
- [ ] Autorização das pessoas retratadas (ou dos clientes que encomendaram) para exibir retratos na galeria (ela vai mandar).
- [ ] Por quanto tempo guardar as fotos de referência dos clientes após o pedido ser concluído ou cancelado (LGPD).
- [ ] Se quer pedir ao cliente autorização para publicar a obra final no portfólio.

## Pendências do plano da Fase 1 (ver `arquitetura.md`)

Propostas apresentadas em 09/11/2026, aguardando resposta. Cada uma tem solução provisória configurável.

- [ ] **Custos e titularidade das contas.** Vercel Hobby não permite uso comercial: publicar no Pro (cerca de US$ 20/mês, conferir valor atual). Supabase gratuito pausa após 7 dias sem uso e tem 1 GB de armazenamento: começar no gratuito com ping diário e migrar para o Pro (cerca de US$ 25/mês) se necessário. Definir em nome de quem ficam as contas (ideal: da Carla).
- [x] **Ícone de sacola do cabeçalho.** Adotado provisoriamente: removido (decisão 10). Alternativa futura: "Minhas inspirações".
- [x] **Nomes "Pintura física" e "Tipos de pintura".** Adotado provisoriamente: "Obra feita à mão" e "Tipos de obra" (decisão 10).
- [x] **Configurador em 5 telas** cobrindo as 9 etapas do briefing. Feito na entrega 5 (sem objeção).
- [ ] **E-mail de confirmação para o cliente.** Recomendado; depende do domínio verificado no Resend.
- [ ] **Autorização de portfólio no pedido.** Adotado provisoriamente: caixa opcional, desmarcada, desligável na configuração (decisão 13).
- [ ] **Retenção das referências.** Proposta: apagar N dias após conclusão/cancelamento, N configurável.
- [ ] **Número do pedido.** Proposta: `CF-2026-0001`, sequencial por ano.
- [ ] **Limites de upload.** Padrão técnico provisório: até 10 imagens de 10 MB (JPG, PNG, WebP), configurável.
