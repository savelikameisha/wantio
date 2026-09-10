import type { SupabaseClient } from "@supabase/supabase-js";
import { itemSchema, type ItemInput } from "@/lib/validation";
export async function saveItem(
  client: SupabaseClient,
  input: ItemInput,
  create: boolean,
) {
  const item = itemSchema.parse(input);
  const id = item.id || crypto.randomUUID();
  const { data, error } = await client.rpc("save_wishlist_item", {
    p_item: item,
    p_id: id,
    p_create: create,
  });
  if (error)
    throw new Error(
      "Could not save this item. Check the selected tags and try again.",
    );
  return data as string;
}
