create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null check (length(trim(name)) > 0),
  currency text not null check (currency in ('TRY', 'USD', 'EUR')),

  target_amount numeric(14,2) not null check (target_amount > 0),

  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),

  target_date date,

  created_at timestamptz not null default now()
);

create index goals_user_idx on goals (user_id, created_at desc);
