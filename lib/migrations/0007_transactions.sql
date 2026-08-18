create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,

  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency in ('TRY', 'USD', 'EUR')),
  rate_to_base numeric(14,6) not null check (rate_to_base > 0),
  amount_base numeric(14,2) not null check (amount_base > 0),

  type text not null check (type in ('income', 'expense')),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions (user_id, date desc);