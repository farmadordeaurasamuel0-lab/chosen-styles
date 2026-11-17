# Controle de estoque (manual, até o banco de dados existir)

O estoque publicado no site fica em `frontend/src/scripts/02-catlogo.js`.
Cada venda confirmada pela loja deve ser registrada aqui e refletida no site.

## Estoque atual (publicado)

| Peça | P | M | G | GG | Total |
|---|---|---|---|---|---|
| CRISTÃ Essential — Off-White | 15 | 4 | 1 | 6 | 26 |
| CRISTÃ Essential — Black | 1 | 18 | 22 | 7 | 48 |

## Vendas confirmadas

| Data | Peça | Tamanho | Qtde | Pedido (WhatsApp) | Estoque após a venda |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## Vendas enviadas pelo site

Quando o cliente finaliza um pedido pelo WhatsApp, as unidades somem do estoque mostrado naquele navegador (confere na sacola e tamanho indisponível). Isso não altera o estoque oficial: a loja continua atualizando `frontend/src/scripts/02-catlogo.js` depois de confirmar cada venda, e o desconto oficial passa a ser feito pelo servidor quando ele existir.

## Como atualizar
1. Registre a venda na tabela acima.
2. Subtraia a quantidade do tamanho correspondente em `02-catlogo.js`.
3. Rode `npm run build` na pasta `frontend` e publique de novo.

Limite: enquanto isso for manual, duas vendas simultâneas da última unidade podem não ser percebidas pelo site.
