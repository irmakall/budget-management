create policy "Users can read own profile"
on profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can create own profile"
on profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);