-- Catálogo, estoque por variante, pedidos e administração.
-- Regras:
--  * stock_quantity NULL = estoque não confirmado = indisponível para compra.
--  * Preços e estoque são lidos e validados no servidor (função create_order).
--  * Pedido só é marcado como pago pela função mark_order_paid, chamada pelo servidor
--    após confirmação do provedor de pagamento.
--  * Clientes não gravam pedidos diretamente.

create type order_status as enum ('pending_payment', 'paid', 'cancelled', 'fulfilled');

-- Produtos
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  collection text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 0),
  promo_price_cents integer check (promo_price_cents is null or promo_price_cents >= 0),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Variantes (tamanho e cor) com estoque
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  size text not null check (size in ('P', 'M', 'G', 'GG')),
  color text not null default '',
  sku text unique,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  unique (product_id, size, color)
);

-- Cupons (vazio até as regras serem definidas)
create table if not exists public.coupons (
  code text primary key,
  percent_off integer check (percent_off is null or percent_off between 1 and 100),
  amount_off_cents integer check (amount_off_cents is null or amount_off_cents >= 0),
  active boolean not null default false,
  valid_until timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0
);

-- Administradores (usuários autenticados com papel de administrador)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Pedidos e itens
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
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

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  size text not null,
  color text not null default '',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

-- Vista pública: só informa se a variante está disponível, sem expor a quantidade exata.
create or replace view public.catalog_availability as
  select v.product_id, v.size, v.color, (v.stock_quantity > 0) as available
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where p.active;

-- Row Level Security
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.coupons enable row level security;
alter table public.admins enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "produtos ativos: leitura pública"
  on public.products for select to anon, authenticated
  using (active);

create policy "produtos: administrador gerencia"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "variantes: administrador gerencia"
  on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "cupons: administrador gerencia"
  on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins: somente administradores leem"
  on public.admins for select to authenticated
  using (public.is_admin());

create policy "pedidos: cliente lê os próprios"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "itens: cliente lê os do próprio pedido"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  ));

-- Nenhuma política de insert/update/delete para clientes em orders e order_items.

-- Vista de disponibilidade: leitura pública, sem colunas sensíveis.
grant select on public.catalog_availability to anon, authenticated;

-- Criação de pedido: valida no banco, calcula preços e estoque.
-- Não baixa estoque: o estoque só sai quando o pagamento é confirmado.
create or replace function public.create_order(p_email text, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_item jsonb;
  v_variant public.product_variants;
  v_product public.products;
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

  insert into public.orders (user_id, email, subtotal_cents, total_cents)
  values (auth.uid(), lower(trim(p_email)), 0, 0)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'quantidade inválida';
    end if;

    select * into v_variant from public.product_variants
      where id = (v_item ->> 'variant_id')::uuid for update;
    if not found then
      raise exception 'variante não encontrada';
    end if;

    select * into v_product from public.products where id = v_variant.product_id;
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

    insert into public.order_items (order_id, variant_id, product_name, size, color,
      unit_price_cents, quantity, line_total_cents)
    values (v_order, v_variant.id, v_product.name, v_variant.size, v_variant.color,
      v_unit, v_qty, v_unit * v_qty);

    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  update public.orders set subtotal_cents = v_subtotal, total_cents = v_subtotal
    where id = v_order;
  return v_order;
end;
$$;

-- Confirmação de pagamento: somente o servidor (service_role) executa. Baixa o estoque.
create or replace function public.mark_order_paid(p_order uuid, p_provider text, p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if (select status from public.orders where id = p_order) <> 'pending_payment' then
    raise exception 'pedido não está aguardando pagamento';
  end if;
  for r in select variant_id, quantity from public.order_items where order_id = p_order loop
    update public.product_variants
      set stock_quantity = stock_quantity - r.quantity
      where id = r.variant_id and stock_quantity >= r.quantity;
    if not found then
      raise exception 'estoque insuficiente na confirmação';
    end if;
  end loop;
  update public.orders
    set status = 'paid', payment_provider = p_provider, payment_reference = p_reference, paid_at = now()
    where id = p_order;
end;
$$;

revoke execute on function public.create_order(text, jsonb) from public;
grant execute on function public.create_order(text, jsonb) to anon, authenticated;
revoke execute on function public.mark_order_paid(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
