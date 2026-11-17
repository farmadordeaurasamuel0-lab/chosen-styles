# Auditoria técnica e visual — Chosen Styles

Esta auditoria distingue o que foi **testado no navegador** do que foi **apenas analisado** no código.
Os testes rodam em Chromium headless (ver `frontend/tests/e2e/README.md`). Não foram feitos testes em
aparelhos reais nem com leitores de tela.

## 1. Testado no navegador (40 verificações automatizadas, todas passando)

- **Largura:** nenhuma rolagem horizontal em 360, 390, 768, 1280 e 1920 px.
- **Navegação:** links do cabeçalho visíveis a partir de 600 px; no celular, navegação pelo rodapé e pela rolagem.
- **Compra:** página do produto pelo endereço, curtir, cadastro com validação, pagamento, resumo,
  troca de pagamento depois de revisar, bloqueio da finalização sem WhatsApp configurado.
- **Sacola:** limite de estoque, remoção, total zerado ao esvaziar.
- **Diálogos e teclado:** foco entra na sacola, Tab não sai dela, Escape fecha e devolve o foco;
  todos os elementos alcançados por Tab têm indicador visível de foco.
- **Movimento:** com a preferência de movimento reduzido, nenhuma animação roda.
- **Primeira visita:** abertura aparece, termina e a tela inicial fica visível, sem erros.
- **Segurança:** política de conteúdo com hashes, sem bloqueios em uma sessão normal.
- **Acessibilidade estrutural:** idioma pt-BR, um único h1, campos com rótulo, botões com nome,
  imagens com texto alternativo, faixa decorativa oculta da leitura de tela.
- **Legibilidade e contraste:** nenhum texto abaixo de 12 px no celular (exceto a marca "STYLES" do logotipo);
  265 textos medidos com contraste dentro do mínimo WCAG.
- **Consolidação do CSS:** 84 mesclagens de seletores repetidos, validadas por comparação do estilo
  calculado e da posição de 5.646 elementos em 8 telas (sem diferença) e por comparação de pixels
  em 6 capturas de página inteira (idênticas). Três mesclagens foram mantidas de fora por segurança.

## 2. Corrigido nesta auditoria

- Rolagem horizontal no celular causada pela grade da vitrine.
- Troca de forma de pagamento depois de revisar não atualizava o resumo nem a mensagem do WhatsApp.
- Cadastro vazio mostrava a mensagem de pagamento no lugar dos dados pessoais faltantes.
- Resumo de pagamento abria vazio quando nenhuma forma estava escolhida.
- Total da sacola não zerava ao remover a última peça.
- Foco não entrava na sacola ao abrir, e o Tab escapava dela (armadilha de foco corrigida).
- Erro ao abrir a página do painel administrativo diretamente pelo endereço.
- Botão de curtir ausente ao abrir a página do produto pelo endereço.
- Cabeçalho não reaparecia ao adicionar uma peça no celular.
- Contraste insuficiente no texto de direitos autorais.
- Textos de apoio abaixo de 12 px no celular.
- Dois títulos h1 na página.
- Faixa decorativa "Em breve" sendo lida pelo leitor de tela.
- Links do cabeçalho inacessíveis em tablets; menu morto removido.
- Política de conteúdo com `'unsafe-inline'` para scripts, substituída por hashes gerados no build.
- Código morto removido: menu, função de pedido de teste, recorte antigo, seletores sem uso.
- Área de toque ampliada nos links do rodapé e do hero (sem mudar o desenho).

## 3. Pendente (depende de você ou de servidor)

- **Servidor e pagamento:** backend (API e PostgreSQL), provedor de pagamento, confirmação de pagamento,
  estoque em tempo real e envio de pedidos. Hoje estoque e preços ficam no código do site.
- **Painel administrativo:** sem autenticação real (lista de administradores vazia e verificação no navegador).
- **Dados de clientes:** contas e pedidos ficam no armazenamento local do navegador, incluindo dados pessoais.
  Recomenda-se desativar a criação de contas até existir servidor.
- **Negócio:** número do WhatsApp da loja, CEP de origem em Goiânia, política de privacidade e LGPD,
  políticas de troca e reembolso, tabela de medidas, materiais, CNPJ e contato.
- **CSS:** ainda há seletores redefinidos dentro de blocos `@media` e as três mesclagens mantidas de fora.
- **Testes reais:** aparelhos Android e iPhone, leitores de tela e medição de desempenho no aparelho.
- **Contrato de pagamento:** `PAYMENT_PROVIDER` em `00b-pagamento.js` é intencional (contrato para a integração).

## 4. Avaliação (estimativa, sem testes em aparelho real)

| Área | Nota | Observação |
|---|---|---|
| Design | 7 | Identidade preservada; não foi possível avaliar visualmente por imagem. |
| Organização do código | 6 | Código morto removido e CSS consolidado em parte; ainda há camadas de correção. |
| Desempenho | 5 | Sem medição em aparelho; o arquivo tem ~620 KB por causa das imagens embutidas. |
| Experiência mobile | 7 | Sem rolagem horizontal e textos legíveis; navegação só pelo rodapé no celular. |
| Acessibilidade | 8 | Foco, diálogos, contraste e semântica verificados automaticamente. |
| Preparação comercial | 3 | Depende de servidor, pagamento e dados de negócio listados acima. |

## 5. Pedido enviado: conta e sacola

- Ao finalizar pelo WhatsApp, o pedido é registrado no navegador com número (`PED-…`), data, itens, total e forma de pagamento, e o WhatsApp da loja é aberto com a mensagem pronta.
- A sacola mostra a peça enviada com um **confere** ("Pedido enviado"). Ela deixa de contar no total e no contador, e não tem controles de quantidade. Remover a linha não apaga o histórico.
- A conta mostra **"Compra enviada com sucesso"** para quem entrou com o mesmo e-mail do pedido, com itens, número, data e a nota "Aguardando confirmação do pagamento pela loja".
- O estoque mostrado neste navegador desconta as unidades enviadas. Isso não altera o estoque oficial, que continua em `frontend/src/scripts/02-catlogo.js` até existir o servidor.

**Limites, que dependem de servidor e do provedor de pagamento:**
- O site não confirma pagamento. "Enviada" significa que o pedido foi gerado e o WhatsApp da loja foi aberto; a loja precisa confirmar.
- Os pedidos e o desconto de estoque ficam só no navegador. Outro visitante continua vendo o estoque original.
- O botão de finalizar fica bloqueado até o número do WhatsApp da loja ser configurado.
- Para testar o fluxo, use a compilação de teste descrita em `frontend/tests/e2e/README.md` (`npm run test:pedidos`).

## Correção: tela de carregamento travada na data de lançamento (10/11/2026)

- Causa: o cronômetro do lançamento chamava a própria função de atualização antes de criar o intervalo que ela usa. Quando a contagem chegou a zero (a partir de 10/11/2026, 00:00, horário de Brasília), o erro interrompia o script, e a tela de carregamento e a abertura nunca eram removidas.
- Correção: o intervalo passa a ser criado antes da primeira atualização.
- Armazenamento: localStorage e sessionStorage agora são acessados por um módulo que nunca lança erro. Sem armazenamento, a sessão continua só na memória desta aba, e o cadastro de conta mostra a mensagem de falha em vez de quebrar.
- Rede de segurança: se qualquer erro interromper o script, a tela de carregamento e a abertura são removidas 8 segundos depois do início.
- Teste de regressão: `npm run test:carregamento` cobre depois do lançamento, armazenamento bloqueado, pular a abertura, repetição na mesma sessão e erro no meio do script. A versão com o erro antigo falha em 10 verificações.

## Seletor de quantidade na página do produto

- Novo controle de quantidade acima de "Adicionar à sacola" e "Comprar agora", com − e +, número animado e aviso de limite.
- Limite: o menor valor entre 10 peças e o estoque do tamanho, descontando o que já está na sacola. Com tamanho não escolhido, o controle fica desativado.
- Segurar o botão repete a contagem (depois de 400 ms, a cada 80 ms). Teclado (Enter e Espaço) também funciona.
- Com movimento reduzido ativado, não há animação, e o controle continua funcionando.
- Testes: `npm run test:quantidade` (limite, estoque, segurar, teclado, compra e movimento reduzido).

## Correção: letras dos botões de compra

- Causa: os botões "Adicionar à sacola" e "Comprar agora" dividem o texto em letras, e o espaço de 10 px do botão separava cada letra. Em botões estreitos, como na página do produto, as letras encolhiam até ficar ilegíveis.
- Correção: letras sem espaço entre si e sem encolher. Na vitrine, o espaçamento entre as letras ficou mais próximo do padrão do site.

## Contato: Instagram ativado

- O Instagram do rodapé aponta para @vitorsamuel_bjj (abre em nova aba). A configuração fica em `frontend/src/scripts/21-contatos-preencher-para-ativar-os-links.js`.
- WhatsApp continua desativado até a loja informar o número.
- Teste: `npm run test:contato`.
