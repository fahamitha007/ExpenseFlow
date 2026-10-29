-- Run this entire script in Supabase Dashboard -> SQL Editor -> New query.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('Income','Expense')),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can read their own transactions" on public.transactions;
create policy "Users can read their own transactions" on public.transactions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions" on public.transactions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions" on public.transactions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions" on public.transactions
  for delete to authenticated using (auth.uid() = user_id);

-- Helps each account load its own transactions efficiently.
create index if not exists transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
