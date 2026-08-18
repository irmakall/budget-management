
create policy "Users can create own transaction"
on transactions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1 from categories c
      where c.id = category_id
        and c.user_id = auth.uid()
    )
  )
);

create policy "Users can update own transaction"
on transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    category_id is null
    or exists (
      select 1 from categories c
      where c.id = category_id
        and c.user_id = auth.uid()
    )
  )
);