-- iPerto canonical production schema: RLS + least-privilege Data API grants
alter table public.iphone_models enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

create policy models_public_read on public.iphone_models for select to anon,authenticated using(enabled=true);

create policy profiles_own_read on public.profiles for select to authenticated using((select auth.uid())=id);
create policy profiles_own_update on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);

create policy active_listings_public_read on public.listings for select to anon,authenticated using(status='active' or (select auth.uid())=seller_id);
create policy listings_own_insert on public.listings for insert to authenticated with check((select auth.uid())=seller_id);
create policy listings_own_update on public.listings for update to authenticated using((select auth.uid())=seller_id) with check((select auth.uid())=seller_id);
create policy listings_own_delete on public.listings for delete to authenticated using((select auth.uid())=seller_id);

create policy photos_public_read on public.listing_photos for select to anon,authenticated using(exists(select 1 from public.listings l where l.id=listing_photos.listing_id and (l.status='active' or l.seller_id=(select auth.uid()))));
create policy photos_owner_insert on public.listing_photos for insert to authenticated with check(exists(select 1 from public.listings l where l.id=listing_photos.listing_id and l.seller_id=(select auth.uid())));
create policy photos_owner_update on public.listing_photos for update to authenticated using(exists(select 1 from public.listings l where l.id=listing_photos.listing_id and l.seller_id=(select auth.uid()))) with check(exists(select 1 from public.listings l where l.id=listing_photos.listing_id and l.seller_id=(select auth.uid())));
create policy photos_owner_delete on public.listing_photos for delete to authenticated using(exists(select 1 from public.listings l where l.id=listing_photos.listing_id and l.seller_id=(select auth.uid())));

create policy favorites_own_read on public.favorites for select to authenticated using((select auth.uid())=user_id);
create policy favorites_own_insert on public.favorites for insert to authenticated with check((select auth.uid())=user_id);
create policy favorites_own_delete on public.favorites for delete to authenticated using((select auth.uid())=user_id);

create policy reports_own_read on public.reports for select to authenticated using((select auth.uid())=reporter_id);
create policy reports_own_insert on public.reports for insert to authenticated with check((select auth.uid())=reporter_id);
create policy reports_own_update_never on public.reports for update to authenticated using(false);

revoke all on table public.iphone_models,public.profiles,public.listings,public.listing_photos,public.favorites,public.reports from anon,authenticated;
grant select on table public.iphone_models to anon,authenticated;
grant select on table public.listings,public.listing_photos to anon;
grant select,insert,update,delete on table public.listings,public.listing_photos to authenticated;
grant select on table public.profiles to authenticated;
grant update(display_name,avatar_url,whatsapp,city,state) on table public.profiles to authenticated;
grant select,insert,delete on table public.favorites to authenticated;
grant select,insert on table public.reports to authenticated;
