# Backend — Chosen Styles (PostgreSQL)

Decisão: banco de dados **PostgreSQL** puro, sem dependência do Supabase.

## Arquivos
- `db/schema.sql`: esquema completo (usuários, sessões, catálogo, estoque por variante, cupons, pedidos e itens), com as funções `create_order` e `mark_order_paid`.
- `supabase/`: versão anterior, para o Supabase. Mantida apenas como referência.
- `.env.example`: variáveis necessárias, sem valores.

## O que muda em relação ao Supabase
- **Controle de acesso:** deixa de ser feito por RLS. Quem decide se a pessoa pode ler ou alterar algo é a API (servidor), que valida a sessão e o papel de administrador antes de cada operação.
- **Autenticação:** a API cria as contas, guarda a senha apenas como hash (argon2 ou bcrypt) e emite sessões em cookie `httpOnly`.
- **Pagamento:** o pedido só vira "pago" pela função `mark_order_paid`, chamada pelo servidor depois de validar a assinatura do provedor.

## Pendências (dependem de você)
1. **Onde hospedar o PostgreSQL.** Opções comuns: Neon, Vercel Postgres ou Railway. Você cria o banco e guarda a `DATABASE_URL` nas variáveis de ambiente do Vercel, nunca no repositório.
2. **Provedor de pagamento.** Ainda não escolhido.
3. **Primeiro administrador.** Criado pela API depois que o banco estiver ligado, com uma senha que só você define.

## Ordem sugerida
1. Criar o banco PostgreSQL e executar `db/schema.sql`.
2. Criar a API (funções do Vercel em `api/`) com conexão ao banco e autenticação.
3. Ligar o site à API e ao provedor de pagamento escolhido.

Observação: o `schema.sql` ainda não foi executado. Ele precisa ser testado no seu banco antes de ser usado.
