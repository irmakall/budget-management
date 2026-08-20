alter table budgets enable row level security;

drop policy if exists "Users can read own budgets" on budgets;
create policy "Users can read own budgets"
on budgets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete own budgets" on budgets;
create policy "Users can delete own budgets"
on budgets
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own budgets" on budgets;
create policy "Users can create own budgets"
on budgets
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own budgets" on budgets;
create policy "Users can update own budgets"
on budgets
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);
