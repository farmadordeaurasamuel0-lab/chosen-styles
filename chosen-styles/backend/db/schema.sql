-- Chosen Styles: esquema para PostgreSQL puro (sem dependências do Supabase).
-- O controle de acesso fica no servidor (API), não em RLS.
-- Ainda não executado: rode no seu banco PostgreSQL (versão 14 ou superior).

create extension if not exists pgcrypto;

-- Contas de clientes e administradores. A senha nunca é guardada em texto:
-- password_hash contém o resultado de um algoritmo de derivação (argon2 ou bcrypt), calculado pelo servidor.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (position('@' in email) > 1),
  full_name text not null check (char_length(full_name) between 2 and 80),
  password_hash text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sessões de login. Guarda apenas o hash do token enviado ao navegador.
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);

-- Catálogo
create table if not exists products (
  id text primary key,
  name text not null,
  description text not null default '',
  collection text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 0),
  promo_price_cents integer check (promo_price_cents is null or promo_price_cents >= 0),
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Variantes por tamanho e cor. stock_quantity NULL = estoque não confirmado = indisponível.
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products (id) on delete cascade,
  size text not null check (size in ('P', 'M', 'G', 'GG')),
  color text not null default '',
  sku text unique,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  unique (product_id, size, color)
);

-- Cupons (sem regras definidas ainda)
create table if not exists coupons (
  code text primary key,
  percent_off integer check (percent_off is null or percent_off between 1 and 100),
  amount_off_cents integer check (amount_off_cents is null or amount_off_cents >= 0),
  active boolean not null default false,
  valid_until timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0
);

-- Pedidos
create type order_status as enum ('pending_payment', 'paid', 'cancelled', 'fulfilled');

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  email text not null,
  status order_status not null default 'pending_payment',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists orders_user_idx on orders (user_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete set null,
  product_name text not null,
  size text not null,
  color text not null default '',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

-- Criação de pedido: calcula preços e valida estoque no banco.
-- Não baixa estoque: o estoque só sai quando o pagamento é confirmado.
create or replace function create_order(p_user uuid, p_email text, p_items jsonb)
returns uuid
language plpgsql
as $$
declare
  v_order uuid;
  v_item jsonb;
  v_variant product_variants;
  v_product products;
  v_qty integer;
  v_unit integer;
  v_subtotal integer := 0;
begin
  if p_email is null or position('@' in p_email) < 2 then
    raise exception 'e-mail inválido';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'pedido sem itens';
  end if;

  insert into orders (user_id, email, subtotal_cents, total_cents)
  values (p_user, lower(trim(p_email)), 0, 0)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'quantidade inválida';
    end if;

    select * into v_variant from product_variants
      where id = (v_item ->> 'variant_id')::uuid for update;
    if not found then
      raise exception 'variante não encontrada';
    end if;

    select * into v_product from products where id = v_variant.product_id;
    if not v_product.active then
      raise exception 'produto indisponível';
    end if;
    if v_variant.stock_quantity is null or v_variant.stock_quantity < v_qty then
      raise exception 'estoque insuficiente ou não confirmado';
    end if;

    v_unit := coalesce(v_product.promo_price_cents, v_product.price_cents);
    if v_unit is null then
      raise exception 'preço não configurado';
    end if;

    insert into order_items (order_id, variant_id, product_name, size, color,
      unit_price_cents, quantity, line_total_cents)
    values (v_order, v_variant.id, v_product.name, v_variant.size, v_variant.color,
      v_unit, v_qty, v_unit * v_qty);

    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  update orders set subtotal_cents = v_subtotal, total_cents = v_subtotal where id = v_order;
  return v_order;
end;
$$;

-- Confirmação de pagamento: chamada somente pelo servidor, após validar a assinatura do provedor.
-- Baixa o estoque no mesmo passo em que marca o pedido como pago.
create or replace function mark_order_paid(p_order uuid, p_provider text, p_reference text)
returns void
language plpgsql
as $$
declare
  r record;
begin
  if (select status from orders where id = p_order) <> 'pending_payment' then
    raise exception 'pedido não está aguardando pagamento';
  end if;
  for r in select variant_id, quantity from order_items where order_id = p_order loop
    update product_variants
      set stock_quantity = stock_quantity - r.quantity
      where id = r.variant_id and stock_quantity >= r.quantity;
    if not found then
      raise exception 'estoque insuficiente na confirmação';
    end if;
  end loop;
  update orders
    set status = 'paid', payment_provider = p_provider, payment_reference = p_reference, paid_at = now()
    where id = p_order;
end;
$$;
