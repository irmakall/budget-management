alter table recurring_rules enable row level security;

drop policy if exists "Users can read own recurring rules" on recurring_rules;
create policy "Users can read own recurring rules"
on recurring_rules
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own recurring rule" on recurring_rules;
create policy "Users can create own recurring rule"
on recurring_rules
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

drop policy if exists "Users can update own recurring rule" on recurring_rules;
create policy "Users can update own recurring rule"
on recurring_rules
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

drop policy if exists "Users can delete own recurring rules" on recurring_rules;
create policy "Users can delete own recurring rules"
on recurring_rules
for delete
to authenticated
using (auth.uid() = user_id);
