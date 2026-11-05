create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null check (char_length(btrim(full_name)) between 2 and 80),
  is_adult       boolean not null check (is_adult),
  terms_version  text not null,
  accepted_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfil: ler o próprio" on public.profiles;
create policy "perfil: ler o próprio" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "perfil: criar o próprio" on public.profiles;
create policy "perfil: criar o próprio" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "perfil: editar o próprio" on public.profiles;
create policy "perfil: editar o próprio" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status           text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  tag              text not null check (tag in ('Quarto individual', 'Quarto em república', 'Apartamento', 'Kitnet / Studio')),
  title            text not null check (char_length(btrim(title)) between 5 and 80),
  room_type        text not null check (char_length(btrim(room_type)) between 3 and 80),
  campus_id        text not null check (char_length(campus_id) between 2 and 40),
  neighborhood     text not null check (char_length(btrim(neighborhood)) between 2 and 60),
  description      text not null check (char_length(btrim(description)) between 20 and 1500),
  features         text[] not null default '{}' check (cardinality(features) <= 12),
  price            integer not null check (price between 100 and 20000),
  estimated_bills  integer not null default 0 check (estimated_bills between 0 and 5000),
  lat              double precision,
  lng              double precision,
  image_url        text,
  created_at       timestamptz not null default now(),
  constraint publicado_precisa_de_localizacao
    check (status <> 'published' or (lat is not null and lng is not null))
);

alter table public.listings add column if not exists house_routine jsonb;
alter table public.listings drop constraint if exists rotina_formato;
alter table public.listings add constraint rotina_formato check (
  house_routine is null
  or (jsonb_typeof(house_routine) = 'object' and length(house_routine::text) <= 2000)
);

create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists listings_status_idx on public.listings (status);

alter table public.listings enable row level security;

drop policy if exists "anúncio: ver publicados ou os próprios" on public.listings;
create policy "anúncio: ver publicados ou os próprios" on public.listings
  for select using (status = 'published' or owner_id = auth.uid());

drop policy if exists "anúncio: criar como pendente" on public.listings;
create policy "anúncio: criar como pendente" on public.listings
  for insert with check (
    owner_id = auth.uid()
    and status = 'pending'
    and lat is null and lng is null and image_url is null
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "anúncio: excluir o próprio" on public.listings;
create policy "anúncio: excluir o próprio" on public.listings
  for delete using (owner_id = auth.uid());

create table if not exists public.listing_addresses (
  listing_id  uuid primary key references public.listings (id) on delete cascade,
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cep         text not null check (cep ~ '^[0-9]{8}$'),
  street      text not null check (char_length(btrim(street)) between 2 and 120),
  number      text not null check (char_length(btrim(number)) between 1 and 10),
  complement  text check (complement is null or char_length(complement) <= 60),
  city        text not null check (char_length(btrim(city)) between 2 and 60),
  state       text not null check (state ~ '^[A-Z]{2}$'),
  created_at  timestamptz not null default now()
);

create index if not exists listing_addresses_owner_idx on public.listing_addresses (owner_id);

alter table public.listing_addresses enable row level security;

drop policy if exists "endereço: ver o próprio" on public.listing_addresses;
create policy "endereço: ver o próprio" on public.listing_addresses
  for select using (owner_id = auth.uid());

drop policy if exists "endereço: criar para anúncio próprio" on public.listing_addresses;
create policy "endereço: criar para anúncio próprio" on public.listing_addresses
  for insert with check (
    owner_id = auth.uid()
    and exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

create or replace function public.create_listing(listing jsonb, address jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
  routine jsonb := listing->'house_routine';
begin
  if listing->>'tag' <> 'Quarto em república' or jsonb_typeof(routine) is distinct from 'object' then
    routine := null;
  end if;

  insert into public.listings
    (tag, title, room_type, campus_id, neighborhood, description, features, price, estimated_bills, house_routine)
  values (
    listing->>'tag',
    btrim(listing->>'title'),
    btrim(listing->>'room_type'),
    listing->>'campus_id',
    btrim(listing->>'neighborhood'),
    btrim(listing->>'description'),
    coalesce((select array_agg(f) from jsonb_array_elements_text(listing->'features') as f), '{}'),
    (listing->>'price')::integer,
    coalesce((listing->>'estimated_bills')::integer, 0),
    routine
  )
  returning id into new_id;

  insert into public.listing_addresses (listing_id, cep, street, number, complement, city, state)
  values (
    new_id,
    regexp_replace(address->>'cep', '[^0-9]', '', 'g'),
    btrim(address->>'street'),
    btrim(address->>'number'),
    nullif(btrim(coalesce(address->>'complement', '')), ''),
    btrim(address->>'city'),
    upper(btrim(address->>'state'))
  );

  return new_id;
end;
$$;

revoke all on function public.create_listing(jsonb, jsonb) from public, anon;
grant execute on function public.create_listing(jsonb, jsonb) to authenticated;

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings (id) on delete cascade,
  sender_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipient_id    uuid not null references auth.users (id) on delete cascade,
  sender_name     text not null default '',
  recipient_name  text not null default '',
  body            text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at      timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_recipient_idx on public.messages (recipient_id);
create index if not exists messages_listing_idx on public.messages (listing_id);

alter table public.messages enable row level security;

drop policy if exists "mensagem: ver as minhas" on public.messages;
create policy "mensagem: ver as minhas" on public.messages
  for select using (auth.uid() in (sender_id, recipient_id));

create or replace function public.has_written_to_me(p_listing uuid, p_from uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.messages m
    where m.listing_id = p_listing
      and m.sender_id = p_from
      and m.recipient_id = auth.uid()
  );
$$;

revoke all on function public.has_written_to_me(uuid, uuid) from public, anon;
grant execute on function public.has_written_to_me(uuid, uuid) to authenticated;

drop policy if exists "mensagem: enviar" on public.messages;
create policy "mensagem: enviar" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid())
    and (
      exists (
        select 1 from public.listings l
        where l.id = messages.listing_id and l.status = 'published' and l.owner_id = messages.recipient_id
      )
      or (
        exists (select 1 from public.listings l where l.id = messages.listing_id and l.owner_id = auth.uid())
        and public.has_written_to_me(messages.listing_id, messages.recipient_id)
      )
    )
  );

create or replace function public.set_message_names()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.sender_id := auth.uid();
  select p.full_name into new.sender_name from public.profiles p where p.id = new.sender_id;
  select split_part(p.full_name, ' ', 1) into new.recipient_name from public.profiles p where p.id = new.recipient_id;
  new.sender_name := coalesce(new.sender_name, '');
  new.recipient_name := coalesce(new.recipient_name, '');
  return new;
end;
$$;

drop trigger if exists messages_set_names on public.messages;
create trigger messages_set_names
  before insert on public.messages
  for each row execute function public.set_message_names();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  false,
  52428800,
  array['image/webp', 'image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.listing_media (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path        text not null unique,
  kind        text not null check (kind in ('photo', 'video')),
  position    smallint not null check (position between 0 and 19),
  created_at  timestamptz not null default now()
);

create index if not exists listing_media_listing_idx on public.listing_media (listing_id);
create index if not exists listing_media_owner_idx on public.listing_media (owner_id);

alter table public.listing_media enable row level security;

drop policy if exists "mídia: ver própria ou de anúncio publicado" on public.listing_media;
create policy "mídia: ver própria ou de anúncio publicado" on public.listing_media
  for select using (
    owner_id = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published')
  );

drop policy if exists "mídia: registrar em anúncio próprio pendente" on public.listing_media;
create policy "mídia: registrar em anúncio próprio pendente" on public.listing_media
  for insert with check (
    owner_id = auth.uid()
    and split_part(path, '/', 1) = auth.uid()::text
    and split_part(path, '/', 2) = listing_id::text
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid() and l.status = 'pending'
    )
  );

create or replace function public.check_listing_media_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.listing_media m where m.listing_id = new.listing_id) >= 11 then
    raise exception 'Limite de 11 arquivos por anúncio atingido.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists listing_media_limit on public.listing_media;
create trigger listing_media_limit
  before insert on public.listing_media
  for each row execute function public.check_listing_media_limit();

drop policy if exists "mídia: enviar para anúncio próprio pendente" on storage.objects;
create policy "mídia: enviar para anúncio próprio pendente" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.owner_id = auth.uid()
        and l.status = 'pending'
    )
  );

drop policy if exists "mídia: ver própria ou de anúncio publicado" on storage.objects;
create policy "mídia: ver própria ou de anúncio publicado" on storage.objects
  for select using (
    bucket_id = 'listing-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.listings l
        where l.id::text = (storage.foldername(name))[2] and l.status = 'published'
      )
    )
  );

drop policy if exists "mídia: apagar a própria" on storage.objects;
create policy "mídia: apagar a própria" on storage.objects
  for delete to authenticated using (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "moderador: ver a si mesmo" on public.admins;
create policy "moderador: ver a si mesmo" on public.admins
  for select using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.listing_pois (
  listing_id  uuid primary key references public.listings (id) on delete cascade,
  amenities   jsonb not null check (jsonb_typeof(amenities) = 'array' and jsonb_array_length(amenities) <= 20),
  radius_m    integer not null default 1500,
  fetched_at  timestamptz not null default now()
);

alter table public.listing_pois enable row level security;

drop policy if exists "pontos: ver de anúncio visível" on public.listing_pois;
create policy "pontos: ver de anúncio visível" on public.listing_pois
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.status = 'published' or l.owner_id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "pontos: moderador grava" on public.listing_pois;
create policy "pontos: moderador grava" on public.listing_pois
  for insert with check (public.is_admin());

drop policy if exists "pontos: moderador atualiza" on public.listing_pois;
create policy "pontos: moderador atualiza" on public.listing_pois
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
