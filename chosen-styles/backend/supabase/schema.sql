-- Chosen Styles: contas de clientes e dados salvos por pessoa.
-- Execute no SQL Editor do projeto Supabase.
-- As senhas são guardadas pelo próprio Supabase Auth (tabela auth.users), nunca nesta aplicação.

-- 1. Perfil do cliente, ligado à conta de login
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  created_at timestamptz not null default now()
);

-- 2. Carrinho salvo por cliente (um registro por pessoa)
create table if not exists public.saved_carts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);

-- 3. Cria o perfil automaticamente quando a conta é criada
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'Cliente'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security: cada pessoa lê e altera apenas os próprios dados
alter table public.profiles enable row level security;
alter table public.saved_carts enable row level security;

drop policy if exists "perfil: ler o próprio" on public.profiles;
create policy "perfil: ler o próprio"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "perfil: atualizar o próprio" on public.profiles;
create policy "perfil: atualizar o próprio"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "carrinho: ler o próprio" on public.saved_carts;
create policy "carrinho: ler o próprio"
  on public.saved_carts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "carrinho: inserir o próprio" on public.saved_carts;
create policy "carrinho: inserir o próprio"
  on public.saved_carts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "carrinho: atualizar o próprio" on public.saved_carts;
create policy "carrinho: atualizar o próprio"
  on public.saved_carts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nenhuma política para "anon": visitantes sem login não leem nem gravam nada.
-- A chave pública (anon) do projeto pode ficar no site; a chave service_role nunca.
