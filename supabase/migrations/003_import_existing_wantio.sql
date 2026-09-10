-- Import the later Wantio prototype, if present. Keep source tables intact.
begin;
do $$ begin
 if to_regclass('public.items') is not null and to_regclass('public.labels') is not null then
  insert into public.tags(id,user_id,name,color)
    select id,user_id,name,coalesce(color,'#6366f1') from public.labels on conflict(id) do nothing;
  insert into public.wishlist_items(id,user_id,name,url,image_url,current_price,original_price,currency,notes,is_purchased,is_archived,created_at,updated_at,purchased_price)
    select i.id,i.user_id,i.title,i.url,i.image_url,i.price,
      coalesce((select h.price from public.price_history h where h.item_id=i.id and h.currency=i.currency order by h.checked_at limit 1),i.price),
      coalesce(i.currency,'USD'),i.notes,i.status::text='purchased',i.status::text='archived',i.created_at,i.created_at,
      case when i.status::text='purchased' then i.price else null end
    from public.items i on conflict(id) do nothing;
  insert into public.item_tags(item_id,tag_id)
    select l.item_id,l.label_id from public.item_labels l
    join public.wishlist_items i on i.id=l.item_id join public.tags t on t.id=l.label_id and t.user_id=i.user_id
    on conflict do nothing;
  insert into public.wishlist_price_history(id,item_id,price,currency,recorded_at)
    select id,item_id,price,coalesce(currency,'USD'),checked_at from public.price_history
    where item_id in (select id from public.wishlist_items) on conflict(id) do nothing;
 end if;
end $$;
commit;
