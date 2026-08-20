create table recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,

  name text not null check (char_length(name) between 1 and 60),

  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency in ('TRY', 'USD', 'EUR')),
  type text not null check (type in ('income', 'expense')),

  day_of_month int not null check (day_of_month between 1 and 28),

  start_date date not null,
  end_date date,
  active boolean not null default true,

  created_at timestamptz not null default now(),

  check (end_date is null or end_date >= start_date)
);

create index recurring_rules_user_idx on recurring_rules (user_id, active);
