-- iPerto canonical production schema: core marketplace
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

create table public.iphone_models (
  id bigint generated always as identity primary key,
  name text not null unique,
  generation integer not null,
  enabled boolean not null default true
);

insert into public.iphone_models (id,name,generation) overriding system value values
(1,'iPhone 17 Pro Max',17),(2,'iPhone 17 Pro',17),(3,'iPhone 17 Air',17),(4,'iPhone 17',17),(5,'iPhone 16 Pro Max',16),(6,'iPhone 16 Pro',16),(7,'iPhone 16 Plus',16),(8,'iPhone 16',16),(9,'iPhone 16e',16),(10,'iPhone 15 Pro Max',15),(11,'iPhone 15 Pro',15),(12,'iPhone 15 Plus',15),(13,'iPhone 15',15),(14,'iPhone 14 Pro Max',14),(15,'iPhone 14 Pro',14),(16,'iPhone 14 Plus',14),(17,'iPhone 14',14),(18,'iPhone 13 Pro Max',13),(19,'iPhone 13 Pro',13),(20,'iPhone 13 mini',13),(21,'iPhone 13',13),(22,'iPhone 12 Pro Max',12),(23,'iPhone 12 Pro',12),(24,'iPhone 12 mini',12),(25,'iPhone 12',12),(26,'iPhone 11 Pro Max',11),(27,'iPhone 11 Pro',11),(28,'iPhone 11',11),(29,'iPhone XS Max',10),(30,'iPhone XS',10),(31,'iPhone XR',10),(32,'iPhone X',10),(33,'iPhone 8 Plus',8),(34,'iPhone 8',8),(35,'iPhone 7 Plus',7),(36,'iPhone 7',7);
select setval(pg_get_serial_sequence('public.iphone_models','id'),36,true);

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Usuário iPerto' check (char_length(display_name) between 2 and 60),
 avatar_url text check (avatar_url is null or char_length(avatar_url)<=2048),
 whatsapp text check (whatsapp is null or whatsapp ~ '^55[0-9]{10,11}$'),
 city text check (city is null or char_length(city) between 2 and 80),
 state text check (state is null or state ~ '^[A-Z]{2}$'),
 verified boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.listings (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id) on delete cascade,
 model_id bigint not null references public.iphone_models(id), storage_gb integer not null check (storage_gb=any(array[32,64,128,256,512,1024,2048])),
 color text not null check (char_length(color) between 1 and 40), battery_health smallint not null check (battery_health between 1 and 100),
 condition text not null check (condition=any(array['novo','excelente','muito_bom','bom','regular']::text[])),
 screen_status text not null default 'original' check (screen_status=any(array['original','substituida_original','substituida_paralela','nao_sei']::text[])),
 face_id_ok boolean not null default true, cameras_ok boolean not null default true,
 repair_history text check (repair_history is null or char_length(repair_history)<=500), has_box boolean not null default false, has_invoice boolean not null default false,
 accessories text check (accessories is null or char_length(accessories)<=300), description text check (description is null or char_length(description)<=1000),
 city text not null check (char_length(city) between 2 and 80), state text not null check (state ~ '^[A-Z]{2}$'),
 price numeric(12,2) not null check (price>0 and price<=100000), negotiable boolean not null default false,
 shipping_enabled boolean not null default false, pickup_enabled boolean not null default true,
 status text not null default 'active' check (status=any(array['draft','active','paused','sold']::text[])),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 seller_display_name text not null default 'Vendedor iPerto' check (char_length(seller_display_name) between 2 and 60),
 contact_whatsapp text check (contact_whatsapp is null or contact_whatsapp ~ '^55[0-9]{10,11}$')
);

create table public.listing_photos (id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings(id) on delete cascade,storage_path text not null unique,sort_order integer not null default 0 check(sort_order between 0 and 7),created_at timestamptz not null default now());
create table public.favorites (user_id uuid not null references public.profiles(id) on delete cascade,listing_id uuid not null references public.listings(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,listing_id));
create table public.reports (id uuid primary key default gen_random_uuid(),reporter_id uuid not null references public.profiles(id) on delete cascade,listing_id uuid not null references public.listings(id) on delete cascade,reason text not null check(reason=any(array['suspeita_fraude','informacao_falsa','produto_indisponivel','conteudo_inadequado','outro']::text[])),details text check(details is null or char_length(details)<=500),created_at timestamptz not null default now(),unique(reporter_id,listing_id));

create index listings_status_created_idx on public.listings(status,created_at desc); create index listings_model_idx on public.listings(model_id); create index listings_seller_idx on public.listings(seller_id); create index listings_price_idx on public.listings(price); create index listings_location_idx on public.listings(state,city); create index listing_photos_listing_idx on public.listing_photos(listing_id,sort_order); create unique index listing_photos_position_unique on public.listing_photos(listing_id,sort_order); create index favorites_listing_idx on public.favorites(listing_id); create index reports_listing_idx on public.reports(listing_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger listings_set_updated_at before update on public.listings for each row execute function public.set_updated_at();

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',60),''),left(split_part(new.email,'@',1),60),'Usuário iPerto')); return new; end; $$;
revoke all on function private.handle_new_user() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
