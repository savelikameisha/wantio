"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addItem(formData: {
  name: string;
  url?: string;
  image_url?: string;
  current_price?: number;
  store?: string;
  notes?: string;
  currency?: string;
  tagIds: string[];
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: item, error } = await supabase
    .from("wishlist_items")
    .insert({
      user_id: user.id,
      name: formData.name,
      url: formData.url || null,
      image_url: formData.image_url || null,
      current_price: formData.current_price ?? null,
      original_price: formData.current_price ?? null,
      store: formData.store || null,
      notes: formData.notes || null,
      currency: formData.currency || "USD",
    })
    .select()
    .single();

  if (error) throw error;

  // Insert tag associations
  if (formData.tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("item_tags")
      .insert(
        formData.tagIds.map((tagId) => ({
          item_id: item.id,
          tag_id: tagId,
        }))
      );
    if (tagError) throw tagError;
  }

  // Record initial price in history
  if (formData.current_price) {
    await supabase.from("price_history").insert({
      item_id: item.id,
      price: formData.current_price,
    });
  }

  revalidatePath("/");
}

export async function markPurchased(itemId: string) {
  const supabase = createClient();

  // Get current price first
  const { data: item } = await supabase
    .from("wishlist_items")
    .select("current_price")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      is_purchased: true,
      purchased_at: new Date().toISOString(),
      purchased_price: item?.current_price ?? null,
    })
    .eq("id", itemId);

  if (error) throw error;
  revalidatePath("/");
}

export async function deleteItem(itemId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
  revalidatePath("/");
}

export async function updateItem(
  itemId: string,
  formData: {
    name: string;
    url?: string;
    image_url?: string;
    current_price?: number;
    store?: string;
    notes?: string;
    currency?: string;
    tagIds: string[];
  }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      name: formData.name,
      url: formData.url || null,
      image_url: formData.image_url || null,
      current_price: formData.current_price ?? null,
      store: formData.store || null,
      notes: formData.notes || null,
      currency: formData.currency || "USD",
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw error;

  // Replace tag associations
  await supabase.from("item_tags").delete().eq("item_id", itemId);
  if (formData.tagIds.length > 0) {
    await supabase.from("item_tags").insert(
      formData.tagIds.map((tagId) => ({ item_id: itemId, tag_id: tagId }))
    );
  }

  revalidatePath("/");
}

export async function updateProfile(data: {
  currency?: string;
  price_check_frequency?: string;
  public_share_enabled?: boolean;
  notification_email?: boolean;
  notification_push?: boolean;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/");
}

export async function createTag(name: string, color: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name, color });

  if (error) throw error;
  revalidatePath("/");
}

export async function deleteTag(tagId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) throw error;
  revalidatePath("/");
}
