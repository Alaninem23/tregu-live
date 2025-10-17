-- Profiles & Media
create schema if not exists tregu;

create table if not exists tregu.users (
  id uuid primary key,
  email text unique not null,
  tier text not null default 'personal'
);

create table if not exists tregu.user_profiles (
  user_id uuid primary key references tregu.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  location text,
  website_url text,
  twitter_url text,
  linkedin_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tregu.user_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references tregu.users(id) on delete cascade,
  kind text not null check (kind in ('avatar')),
  storage_key text not null,
  url_full text not null,
  url_medium text,
  url_thumb text,
  mime_type text not null,
  bytes int not null,
  created_at timestamptz not null default now()
);

create table if not exists tregu.user_blocks (
  user_id uuid not null references tregu.users(id) on delete cascade,
  blocked_user_id uuid not null references tregu.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_user_id)
);

create unique index if not exists uq_user_profiles_username on tregu.user_profiles (lower(username));
