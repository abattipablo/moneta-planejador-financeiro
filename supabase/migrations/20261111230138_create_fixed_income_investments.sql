create table public.fixed_income_investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text not null check (category in ('Tesouro Direto', 'CDB', 'LCI/LCA', 'Debênture', 'Outro')),
  issuer text not null check (char_length(trim(issuer)) > 0),
  indexer text not null check (indexer in ('Selic', 'CDI', 'IPCA', 'Prefixado', 'Outro')),
  annual_rate numeric not null default 0 check (annual_rate >= 0),
  amount_invested numeric not null check (amount_invested > 0),
  current_amount numeric check (current_amount is null or current_amount >= 0),
  purchase_date date not null,
  maturity_date date,
  liquidity text,
  created_at timestamptz not null default now(),
  check (maturity_date is null or maturity_date >= purchase_date)
);

alter table public.fixed_income_investments enable row level security;

revoke all on table public.fixed_income_investments from anon;
grant select, insert, update, delete on table public.fixed_income_investments to authenticated;

create policy "Users can view their fixed income investments"
on public.fixed_income_investments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their fixed income investments"
on public.fixed_income_investments for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their fixed income investments"
on public.fixed_income_investments for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their fixed income investments"
on public.fixed_income_investments for delete
to authenticated
using ((select auth.uid()) = user_id);

create index fixed_income_investments_user_id_idx
on public.fixed_income_investments (user_id);
