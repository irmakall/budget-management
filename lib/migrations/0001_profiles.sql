
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  base_currency text not null default 'TRY',
  month_start_day int not null default 6 check (month_start_day between 1 and 28),
  created_at timestamptz not null default now()
);