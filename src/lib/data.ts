import { createClient } from "@/lib/supabase/server";
import { WishlistItem, Tag, Profile } from "@/types";

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: items, error } = await supabase
    .from("wishlist_items")
    .select(
      `
      *,
      item_tags(
        tags(*)
      ),
      price_history:wishlist_price_history(*)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    url: item.url,
    image_url: item.image_url,
    current_price:
      item.current_price != null ? Number(item.current_price) : undefined,
    original_price:
      item.original_price != null ? Number(item.original_price) : undefined,
    store: item.store,
    currency: item.currency || "USD",
    is_purchased: item.is_purchased,
    is_archived: item.is_archived,
    purchased_at: item.purchased_at,
    purchased_price:
      item.purchased_price != null ? Number(item.purchased_price) : undefined,
    notes: item.notes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: (item.item_tags ?? []).map((it: any) => it.tags).filter(Boolean),
    price_history: (item.price_history ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ph: any) => ({
        price: Number(ph.price),
        currency: ph.currency || item.currency || "USD",
        recorded_at: ph.recorded_at,
      }),
    ),
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}
