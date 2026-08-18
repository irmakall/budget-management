create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);

  insert into public.categories (user_id, name, type) values
    (new.id, 'Salary', 'income'),
    (new.id, 'Other income', 'income'),
    (new.id, 'Groceries', 'expense'),
    (new.id, 'Rent', 'expense'),
    (new.id, 'Transport', 'expense'),
    (new.id, 'Dining out', 'expense'),
    (new.id, 'Subscriptions', 'expense'),
    (new.id, 'Other', 'expense');

  return new;
end;
$$;