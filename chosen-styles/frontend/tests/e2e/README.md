# Testes ponta a ponta

Estes testes abrem o site num navegador real (Chromium, via Playwright) e verificam o que o cliente faz:
rolagem horizontal, navegação, compra (cadastro, pagamento, resumo, bloqueio sem WhatsApp), sacola,
diálogos e foco pelo teclado, preferência de movimento reduzido, política de conteúdo, primeira visita,
acessibilidade estrutural, tamanho mínimo de texto e contraste.

## Como rodar

```bash
npm run build                      # gera dist/index.html
npm i -D playwright                # uma vez, para os testes (não é dependência do site)
npx playwright install chromium    # baixa o navegador de teste, uma vez
npm run test:e2e                   # roda os 40 testes
```

Para testar outro arquivo, use `SITE_FILE=caminho/para/index.html npm run test:e2e`.
Se o Playwright estiver instalado fora do projeto, indique o módulo com `PLAYWRIGHT_MODULE=/caminho/do/playwright/index.mjs`.

## O que não é coberto

- Aparelhos reais (Android e iPhone) e navegadores que não sejam o Chromium.
- Leitores de tela (NVDA, VoiceOver, TalkBack): a estrutura é verificada, a leitura real não.
- Estados de passar o cursor (hover) e a aparência visual (cores e tipografia são verificadas por contraste e tamanho, não por imagem).
- Pagamento, estoque em tempo real e envio de pedidos: dependem do servidor e do provedor, que ainda não existem.

## Fluxo de pedido enviado (`pedidos.mjs`)

Este teste precisa de uma compilação com o número do WhatsApp da loja configurado, porque sem ele o botão de finalizar fica bloqueado.
Gere uma cópia de teste com um número fictício (não publique essa cópia):

```bash
cp -r . /tmp/chosen-teste && cd /tmp/chosen-teste
sed -i 's/whatsapp: ""/whatsapp: "5511999999999"/' src/scripts/21-contatos-preencher-para-ativar-os-links.js
node build.mjs && SITE_FILE=dist/index.html node tests/e2e/pedidos.mjs
```

Ele cria uma conta, faz uma compra, confere o "confere" na sacola, verifica a compra na conta, o estoque
que desconta o envio e o histórico preservado ao remover a linha da sacola.

## Carregamento (`carregamento.mjs`)

Confere que a tela de carregamento e a abertura saem sozinhas depois da data de lançamento, com e sem armazenamento bloqueado, e que uma falha no meio do script não deixa o visitante preso. Uso: `SITE_FILE=dist/index.html node tests/e2e/carregamento.mjs` (ou `npm run test:carregamento`).

## Seletor de quantidade (`quantidade.mjs`)

Confere o limite de 10 peças, o limite pelo estoque, segurar para repetir, teclado, Adicionar e Comprar agora somando a quantidade, e o movimento reduzido. Uso: `SITE_FILE=dist/index.html node tests/e2e/quantidade.mjs` (ou `npm run test:quantidade`).

## Contato do rodapé (`contato.mjs`)

Confere o link do Instagram (@vitorsamuel_bjj, em nova aba), o WhatsApp ainda desativado e o e-mail da loja. Uso: `SITE_FILE=dist/index.html node tests/e2e/contato.mjs` (ou `npm run test:contato`).
