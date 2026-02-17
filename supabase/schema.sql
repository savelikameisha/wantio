-- Wantry Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  currency text not null default 'USD',
  price_check_frequency text not null default 'daily', -- 'hourly', 'daily', 'weekly'
  public_share_enabled boolean not null default false,
  public_share_id uuid unique default uuid_generate_v4(),
  notification_email boolean not null default true,
  notification_push boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TAGS
-- ============================================
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null default '#6366f1', -- hex color
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.tags enable row level security;

create policy "Users can manage own tags"
  on public.tags for all
  using (auth.uid() = user_id);

-- ============================================
-- WISHLIST ITEMS
-- ============================================
create table public.wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text,
  image_url text,
  current_price decimal(12,2),
  original_price decimal(12,2),
  store text,
  priority integer not null default 0, -- 0=none, 1=low, 2=medium, 3=high
  is_purchased boolean not null default false,
  purchased_at timestamptz,
  purchased_price decimal(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wishlist_items enable row level security;

create policy "Users can manage own items"
  on public.wishlist_items for all
  using (auth.uid() = user_id);

-- Public share: allow reading active items when share is enabled
create policy "Public can view shared items"
  on public.wishlist_items for select
  using (
    is_purchased = false
    and exists (
      select 1 from public.profiles
      where profiles.id = wishlist_items.user_id
      and profiles.public_share_enabled = true
    )
  );

-- ============================================
-- ITEM TAGS (junction table)
-- ============================================
create table public.item_tags (
  item_id uuid references public.wishlist_items(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (item_id, tag_id)
);

alter table public.item_tags enable row level security;

create policy "Users can manage own item tags"
  on public.item_tags for all
  using (
    exists (
      select 1 from public.wishlist_items
      where wishlist_items.id = item_tags.item_id
      and wishlist_items.user_id = auth.uid()
    )
  );

-- ============================================
-- PRICE HISTORY
-- ============================================
create table public.price_history (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references public.wishlist_items(id) on delete cascade not null,
  price decimal(12,2) not null,
  recorded_at timestamptz not null default now()
);

alter table public.price_history enable row level security;

create policy "Users can view own price history"
  on public.price_history for select
  using (
    exists (
      select 1 from public.wishlist_items
      where wishlist_items.id = price_history.item_id
      and wishlist_items.user_id = auth.uid()
    )
  );

create policy "Users can insert own price history"
  on public.price_history for insert
  with check (
    exists (
      select 1 from public.wishlist_items
      where wishlist_items.id = price_history.item_id
      and wishlist_items.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES
-- ============================================
create index idx_wishlist_items_user_id on public.wishlist_items(user_id);
create index idx_wishlist_items_is_purchased on public.wishlist_items(is_purchased);
create index idx_price_history_item_id on public.price_history(item_id);
create index idx_price_history_recorded_at on public.price_history(recorded_at);
create index idx_tags_user_id on public.tags(user_id);
create index idx_item_tags_item_id on public.item_tags(item_id);
create index idx_item_tags_tag_id on public.item_tags(tag_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_wishlist_items_updated_at
  before update on public.wishlist_items
  for each row execute procedure public.update_updated_at();
