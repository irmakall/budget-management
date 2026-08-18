create policy "Users can read own category"
on categories
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own category"
on categories
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own category"
on categories   
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own category"
on categories   
for delete
to authenticated
using (auth.uid() = user_id);


