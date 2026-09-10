-- Run inside a transaction after migrations, against a staging/rehearsal database.
-- No fixture survives the final rollback in scripts/database-rehearsal.mjs.
select set_config('test.user_a',(select id::text from public.profiles order by id limit 1),true);
select set_config('test.user_b',(select id::text from public.profiles order by id offset 1 limit 1),true);
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
set local role authenticated;
select public.save_wishlist_item('{"name":"Wantio test item","current_price":0,"currency":"PLN","notes":"PRIVATE TEST NOTE","tagIds":[]}', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',true);
select public.save_wishlist_item('{"name":"Wantio test item","current_price":0,"currency":"PLN","notes":"PRIVATE TEST NOTE","tagIds":[]}', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',true);
do $$ begin
 if (select count(*) from public.wishlist_items where id='dddddddd-dddd-4ddd-8ddd-dddddddddd01')<>1 then raise exception 'Retry duplicated item';end if;
 if (select count(*) from public.wishlist_price_history where item_id='dddddddd-dddd-4ddd-8ddd-dddddddddd01')<>1 then raise exception 'Retry duplicated price';end if;
 begin
  perform public.save_wishlist_item('{"name":"Broken tags","currency":"PLN","tagIds":["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"]}', 'dddddddd-dddd-4ddd-8ddd-dddddddddd02',true);
  raise exception 'Expected invalid tag error';
 exception when others then
  if sqlerrm='Expected invalid tag error' then raise;end if;
 end;
 if exists(select 1 from public.wishlist_items where id='dddddddd-dddd-4ddd-8ddd-dddddddddd02')then raise exception 'Partial item persisted';end if;
end $$;
update public.profiles set public_share_enabled=true,public_share_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' where id=auth.uid();
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
do $$ begin
 if exists(select 1 from public.wishlist_items where id='dddddddd-dddd-4ddd-8ddd-dddddddddd01')then raise exception 'Cross-user read';end if;
 begin
  perform public.save_wishlist_item('{"name":"Hijacked","currency":"PLN","tagIds":[]}', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',false);
  raise exception 'Expected owner check error';
 exception when others then
  if sqlerrm='Expected owner check error' then raise;end if;
 end;
end $$;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ declare v jsonb; begin
 if exists(select 1 from public.profiles)then raise exception 'Public profile leak';end if;
 if exists(select 1 from public.wishlist_items)then raise exception 'Public item enumeration';end if;
 if exists(select 1 from public.items)then raise exception 'Legacy public item leak';end if;
 v:=public.get_shared_wishlist('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 if v is null then raise exception 'Shared contract unavailable';end if;
 if v::text like '%PRIVATE TEST NOTE%' or v::text like '%user_id%' or v::text like '%email%' then raise exception 'Private fields exposed';end if;
 if public.get_shared_wishlist('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') is not null then raise exception 'Invalid share found';end if;
end $$;
reset role;
