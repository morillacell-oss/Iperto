-- Keep the closed iPhone catalog current without creating listings.
-- The primary key is GENERATED ALWAYS, so PostgreSQL allocates the IDs safely.
insert into public.iphone_models (name, generation, enabled)
values
  ('iPhone 18 Pro Max', 18, true),
  ('iPhone 18 Pro', 18, true)
on conflict (name) do update
set generation = excluded.generation,
    enabled = true;
