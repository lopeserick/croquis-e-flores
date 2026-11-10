# Decisões e pendências

Registro do que foi decidido antes do desenvolvimento. **Em conflito com o briefing, este arquivo vale.**

## Decisões tomadas

1. **Nome e marca**: o ateliê se chama **Croquis e Flores**. A artista é a **Carla** (Instagram @croquiseflores; bio: "meus croquis, minhas flores e eu").
2. **Paleta**: trocamos a paleta bege/grafite do briefing por **laranja e rosa** (ver `identidade-visual.md`). Motivo: combina com a identidade que a Carla já usa nos posts.
3. **Referências de navegação**: estrutura inspirada em Vivara e Pandora, aprovada no protótipo `design/home-referencia.html`.
4. **Logo**: escolhida a **opção 3 (Silhueta de croqui)**. Os SVGs atuais são **provisórios**; a ideia é a Carla redesenhar à mão e vetorizar.
5. **Categorias no protótipo**: o briefing cita Paisagens, Retratos, Pets e Momentos especiais, mas o portfólio real da Carla é de **croquis de moda, retratos digitais, casais e técnica mista**. O protótipo usa: **Croquis de moda, Retratos, Casais e Momentos especiais**. As categorias devem ser **administráveis no painel** (nada fixo no código).
6. **Placeholders**: nomes de obras, descrições, depoimentos, biografia e e-mail aparecem entre colchetes no protótipo. Nenhum dado fictício deve ir para produção como se fosse real.
7. **Fotos do protótipo**: capturadas do Instagram em ~760px. Na ilustração do casal digital foram **removidos** ícones e uma citação de uma série de TV, para não exibir elementos de obras de terceiros na vitrine.
8. **Sem pagamento online** na primeira versão (fluxo de orçamento), conforme o briefing.

## Pendências com a Carla (bloqueiam a publicação, não o desenvolvimento)

Implementar como **configuração editável** com valor provisório:

- [ ] Autorização para usar as fotos das obras e a foto dela no site.
- [ ] Arquivos originais das obras em alta resolução.
- [ ] Categorias reais que ela vende e se também faz **pinturas físicas** (acrílica, óleo, aquarela), como diz o briefing.
- [ ] Modalidades oferecidas: pintura física, ilustração digital, ilustração digital impressa.
- [ ] Técnicas, tamanhos e formatos de arquivo que ela aceita em cada modalidade.
- [ ] Opções de emolduramento e acabamento, e se faz entregas (para onde).
- [ ] Número do WhatsApp (com DDI 55) e e-mail que recebe os pedidos.
- [ ] Prazo mínimo que ela consegue atender (para limitar o calendário).
- [ ] Limite de tamanho e quantidade de imagens de referência por pedido.
- [ ] Textos da seção "Sobre a artista" (apresentação, história, processo, diferenciais).
- [ ] Depoimentos reais com autorização (nome e cidade/UF).
- [ ] Texto da política de privacidade (LGPD) e dos termos de uso.
- [ ] Domínio do site.
- [ ] Versão final da logo desenhada por ela.
- [ ] Autorização das pessoas retratadas (ou dos clientes que encomendaram) para exibir retratos na galeria.
- [ ] Por quanto tempo guardar as fotos de referência dos clientes após o pedido ser concluído ou cancelado (LGPD).
- [ ] Se quer pedir ao cliente autorização para publicar a obra final no portfólio.

## Pendências do plano da Fase 1 (ver `arquitetura.md`)

Propostas apresentadas em 09/11/2026, aguardando resposta. Cada uma tem solução provisória configurável.

- [ ] **Custos e titularidade das contas.** Vercel Hobby não permite uso comercial: publicar no Pro (cerca de US$ 20/mês, conferir valor atual). Supabase gratuito pausa após 7 dias sem uso e tem 1 GB de armazenamento: começar no gratuito com ping diário e migrar para o Pro (cerca de US$ 25/mês) se necessário. Definir em nome de quem ficam as contas (ideal: da Carla).
- [ ] **Ícone de sacola do cabeçalho.** Proposta: remover na v1. Alternativa: "Minhas inspirações" (favoritos salvos no navegador e anexados ao pedido).
- [ ] **Nomes "Pintura física" e "Tipos de pintura".** Proposta: "Obra feita à mão" e "Tipos de obra" (editáveis no painel).
- [ ] **Configurador em 5 telas** cobrindo as 9 etapas do briefing.
- [ ] **E-mail de confirmação para o cliente.** Recomendado; depende do domínio verificado no Resend.
- [ ] **Autorização de portfólio no pedido.** Proposta: caixa opcional, desmarcada por padrão.
- [ ] **Retenção das referências.** Proposta: apagar N dias após conclusão/cancelamento, N configurável.
- [ ] **Número do pedido.** Proposta: `CF-2026-0001`, sequencial por ano.
- [ ] **Limites de upload.** Padrão técnico provisório: até 10 imagens de 10 MB (JPG, PNG, WebP), configurável. Prazo mínimo do calendário: "a partir de amanhã" até a Carla informar o dela.
