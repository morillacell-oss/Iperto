-- Keep the closed iPhone catalog current without creating listings.
-- IDs are allocated from the current catalog maximum to avoid coupling the migration
-- to a specific pre-existing identifier.
with base as (
  select coalesce(max(id), 0) as max_id
  from public.iphone_models
), incoming(name, generation, ordinal) as (
  values
    ('iPhone 18 Pro Max'::text, 18::integer, 1::bigint),
    ('iPhone 18 Pro'::text, 18::integer, 2::bigint)
)
insert into public.iphone_models (id, name, generation, enabled)
select base.max_id + incoming.ordinal, incoming.name, incoming.generation, true
from base cross join incoming
on conflict (name) do update
set generation = excluded.generation,
    enabled = true;
