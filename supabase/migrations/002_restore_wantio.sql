begin;
drop policy if exists "Public profiles are readable by anyone" on public.profiles;
do $$ begin
 if to_regclass('public.items') is not null then
  execute 'drop policy if exists "Anyone can read items from public wishlists" on public.items';
  execute 'drop policy if exists "Public items are readable by anyone" on public.items';
 end if;
end $$;

-- Keep existing users and wishlist data. Remove broad public table access.
drop policy if exists "Public can view shared profiles" on public.profiles;
drop policy if exists "Public can view shared items" on public.wishlist_items;
drop policy if exists "Users can manage own item tags" on public.item_tags;
create policy "Users can manage own item tags" on public.item_tags for all to authenticated
using (exists(select 1 from public.wishlist_items i where i.id=item_id and i.user_id=auth.uid()))
with check (
 exists(select 1 from public.wishlist_items i where i.id=item_id and i.user_id=auth.uid())
 and exists(select 1 from public.tags t where t.id=tag_id and t.user_id=auth.uid())
);
alter table public.wishlist_price_history add column if not exists currency text;
update public.wishlist_price_history h set currency=i.currency from public.wishlist_items i where h.item_id=i.id and h.currency is null;
alter table public.wishlist_price_history alter column currency set default 'USD';
alter table public.wishlist_price_history alter column currency set not null;

create or replace function public.save_wishlist_item(p_item jsonb, p_id uuid, p_create boolean default false)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
 v_uid uuid := auth.uid(); v_id uuid := p_id; v_old public.wishlist_items;
 v_price numeric := nullif(p_item->>'current_price','')::numeric;
 v_currency text := upper(coalesce(p_item->>'currency','USD')); v_tags uuid[];
begin
 if v_uid is null then raise exception 'Sign in to continue'; end if;
 if p_id is null then raise exception 'Item ID is required'; end if;
 if length(trim(coalesce(p_item->>'name',''))) not between 1 and 200 then raise exception 'Invalid product name'; end if;
 if v_price < 0 or v_price > 9999999999.99 or v_price::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid price'; end if;
 if v_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
 if length(coalesce(p_item->>'notes',''))>3000 or length(coalesce(p_item->>'store',''))>100 then raise exception 'Text is too long'; end if;
 if coalesce(p_item->>'url','')<>'' and p_item->>'url' !~ '^https?://' then raise exception 'Invalid product URL'; end if;
 if coalesce(p_item->>'image_url','')<>'' and p_item->>'image_url' !~ '^https?://' then raise exception 'Invalid image URL'; end if;
 select coalesce(array_agg(distinct value::uuid),'{}'::uuid[]) into v_tags from jsonb_array_elements_text(coalesce(p_item->'tagIds','[]'::jsonb));
 if cardinality(v_tags)>30 or (select count(*) from public.tags where id=any(v_tags) and user_id=v_uid)<>cardinality(v_tags) then raise exception 'One or more tags are no longer available'; end if;
 -- Serialize retries with the same client-generated ID.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into v_old from public.wishlist_items where id=p_id and user_id=v_uid for update;
 if v_old.id is null then
   if not p_create then raise exception 'Item not found'; end if;
   insert into public.wishlist_items(id,user_id,name,url,image_url,current_price,original_price,store,notes,currency)
   values(p_id,v_uid,trim(p_item->>'name'),nullif(p_item->>'url',''),nullif(p_item->>'image_url',''),v_price,v_price,nullif(p_item->>'store',''),nullif(p_item->>'notes',''),v_currency);
 else
   if v_old.is_purchased and v_old.currency<>v_currency then raise exception 'Restore the item before changing its currency'; end if;
   update public.wishlist_items set name=trim(p_item->>'name'),url=nullif(p_item->>'url',''),image_url=nullif(p_item->>'image_url',''),current_price=v_price,
   original_price=case when currency<>v_currency then v_price else original_price end,
   currency=v_currency,store=nullif(p_item->>'store',''),notes=nullif(p_item->>'notes','')
   where id=p_id and user_id=v_uid;
 end if;
 delete from public.item_tags where item_id=p_id;
 insert into public.item_tags(item_id,tag_id) select p_id,unnest(v_tags);
 if v_price is not null and (v_old.id is null or v_old.current_price is distinct from v_price or v_old.currency<>v_currency) then
   insert into public.wishlist_price_history(item_id,price,currency) values(p_id,v_price,v_currency);
 end if;
 return v_id;
end;
$$;
revoke all on function public.save_wishlist_item(jsonb,uuid,boolean) from public,anon;
grant execute on function public.save_wishlist_item(jsonb,uuid,boolean) to authenticated;

-- One explicitly scoped read contract. Notes and account identifiers never leave it.
create or replace function public.get_shared_wishlist(p_share_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('display_name',p.display_name,'items',coalesce((
   select jsonb_agg(jsonb_build_object('id',i.id,'name',i.name,'url',i.url,'image_url',i.image_url,
    'current_price',i.current_price,'original_price',i.original_price,'currency',i.currency,'store',i.store,
    'tags',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'color',t.color))
      from public.item_tags it join public.tags t on t.id=it.tag_id where it.item_id=i.id and t.user_id=p.id),'[]'::jsonb)
   ) order by i.created_at desc) from public.wishlist_items i where i.user_id=p.id and not i.is_purchased and not i.is_archived
 ),'[]'::jsonb)) from public.profiles p where p.public_share_id=p_share_id and p.public_share_enabled;
$$;
revoke all on function public.get_shared_wishlist(uuid) from public;
grant execute on function public.get_shared_wishlist(uuid) to anon,authenticated;

-- Durable per-account limit, shared across server instances.
create table if not exists public.scrape_usage (
 user_id uuid references public.profiles(id) on delete cascade primary key,
 window_start timestamptz not null, requests integer not null
);
alter table public.scrape_usage enable row level security;
revoke all on public.scrape_usage from anon,authenticated;
create or replace function public.consume_scrape_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.scrape_usage(user_id,window_start,requests) values(auth.uid(),date_trunc('hour',now()),1)
 on conflict(user_id) do update set
 requests=case when scrape_usage.window_start<date_trunc('hour',now()) then 1 else scrape_usage.requests+1 end,
 window_start=date_trunc('hour',now())
 returning requests into v_count;
 return v_count<=30;
end; $$;
revoke all on function public.consume_scrape_quota() from public,anon;
grant execute on function public.consume_scrape_quota() to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name,email,name) values(new.id,new.raw_user_meta_data->>'full_name',new.email,new.raw_user_meta_data->>'full_name') on conflict(id) do nothing;
 return new;
end; $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;
insert into public.profiles(id,display_name,email,name) select id,raw_user_meta_data->>'full_name',email,raw_user_meta_data->>'full_name' from auth.users on conflict(id) do nothing;
commit;
