alter table transactions
  add column recurring_rule_id uuid
  references recurring_rules(id) on delete set null;

create unique index transactions_rule_date_idx
  on transactions (recurring_rule_id, date)
  where recurring_rule_id is not null;
