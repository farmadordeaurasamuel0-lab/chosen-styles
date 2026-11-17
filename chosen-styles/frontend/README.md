# Frontend — Chosen Styles

Site estático da loja. O código-fonte fica em `src/` e é reunido em um único arquivo por `build.mjs`.

## Estrutura
- `index.html`: modelo de entrada.
- `src/styles/`: CSS dividido por seção.
- `src/markup/`: marcação dividida por área da página.
- `src/scripts/`: JavaScript da aplicação, em ordem numérica.
- `src/vendor/product-grid.js`: módulo da grade (compilado de `src/ts/product-grid.ts`).
- `src/assets/`: fotos das camisetas e do hero. O build as converte em dados embutidos.
- `tests/logic.test.js`: testes das regras (e-mail, busca, CSV, quantidade, estoque e total).
- `vercel.json`: configuração de publicação no Vercel, com cabeçalhos de segurança.

## Gerar o site localmente
```
npm run build
```
O resultado fica em `dist/index.html`. Para testar as regras:
```
npm test
```

## Publicar no Vercel (passo a passo)
1. Crie uma conta em vercel.com (gratuita para começar).
2. Envie este projeto para um repositório no GitHub. Não envie arquivos com senhas ou chaves.
3. No Vercel, clique em **Add New > Project** e escolha o repositório.
4. Em **Root Directory**, selecione `chosen-styles/frontend` (ou a pasta onde estiver este `README.md`).
5. Confira as configurações, que já vêm do `vercel.json`:
   - Build Command: `node build.mjs`
   - Output Directory: `dist`
6. Clique em **Deploy**. Ao terminar, o Vercel mostra um endereço `*.vercel.app`.
7. Para usar um domínio próprio, vá em **Settings > Domains** e siga as instruções, quando você tiver o domínio.

Cada envio ao repositório gera uma nova publicação automaticamente.

## Limites atuais (antes de vender)
- **Modo de teste ligado:** em `src/scripts/02-catlogo.js`, `DEMO_PURCHASE = true` permite comprar sem estoque confirmado. Troque para `false` antes de vender.
- **Sem pagamento, frete ou banco conectados.** Pedidos feitos no site ficam só no navegador de quem comprou.
- **Contas e painel administrativo** são locais e não protegem dados. A autenticação real depende do Supabase, que ainda não foi configurado.
- **Textos provisórios** em frete, pagamento, parcelamento e reembolso, em `src/scripts/00-condicoes-comerciais.js`.

## Regras
- Não colocar senhas, chaves secretas ou dados de clientes no código.
- Cada arquivo de `src/scripts/` trata de uma única função.
- A chave `service_role` do Supabase nunca vai para o frontend.
