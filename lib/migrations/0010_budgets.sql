create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  category_id uuid not null references categories(id) on delete cascade,

  amount numeric(14,2) not null check (amount > 0),

  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),

  created_at timestamptz not null default now(),

  unique (user_id, category_id, period)
);

create index budgets_user_period_idx on budgets (user_id, period);
