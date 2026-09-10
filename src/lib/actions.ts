"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticatedClient } from "@/lib/server/auth";
import { saveItem } from "@/lib/server/items";
import { tagSchema, type ItemInput, currencySchema } from "@/lib/validation";
export async function addItem(input: ItemInput) {
  const { client } = await authenticatedClient();
  const id = await saveItem(client, input, true);
  revalidatePath("/");
  return id;
}
export async function updateItem(id: string, input: ItemInput) {
  const { client } = await authenticatedClient();
  await saveItem(client, { ...input, id: z.uuid().parse(id) }, false);
  revalidatePath("/");
}
export async function markPurchased(id: string, purchasedPrice?: number) {
  const { client, user } = await authenticatedClient();
  z.uuid().parse(id);
  if (purchasedPrice !== undefined)
    z.number().finite().min(0).max(9999999999.99).parse(purchasedPrice);
  const { data: item, error: readError } = await client
    .from("wishlist_items")
    .select("current_price,is_purchased,purchased_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (readError || !item) throw new Error("Item not found.");
  const { error } = await client
    .from("wishlist_items")
    .update({
      is_purchased: true,
      purchased_at: item.is_purchased
        ? item.purchased_at
        : new Date().toISOString(),
      purchased_price: purchasedPrice ?? item.current_price,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error)
    throw new Error("Could not mark this item as purchased. Try again.");
  revalidatePath("/");
}
export async function restoreItem(id: string) {
  const { client, user } = await authenticatedClient();
  z.uuid().parse(id);
  const { error } = await client
    .from("wishlist_items")
    .update({
      is_archived: false,
      is_purchased: false,
      purchased_at: null,
      purchased_price: null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("Could not restore this item. Try again.");
  revalidatePath("/");
}
export async function deleteItem(id: string) {
  const { client, user } = await authenticatedClient();
  z.uuid().parse(id);
  const { error } = await client
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("Could not delete this item. Try again.");
  revalidatePath("/");
}
export async function updateProfile(input: {
  currency?: string;
  public_share_enabled?: boolean;
}) {
  const data = z
    .object({
      currency: currencySchema.optional(),
      public_share_enabled: z.boolean().optional(),
    })
    .strict()
    .parse(input);
  const { client, user } = await authenticatedClient();
  const { error } = await client
    .from("profiles")
    .update(data)
    .eq("id", user.id);
  if (error) throw new Error("Could not save settings. Try again.");
  revalidatePath("/");
}
export async function createTag(name: string, color: string) {
  const data = tagSchema.parse({ name, color });
  const { client, user } = await authenticatedClient();
  const { data: tag, error } = await client
    .from("tags")
    .insert({ ...data, user_id: user.id })
    .select("id,name,color")
    .single();
  if (error)
    throw new Error(
      error.code === "23505"
        ? "A tag with this name already exists."
        : "Could not create the tag. Try again.",
    );
  revalidatePath("/");
  return tag;
}
export async function deleteTag(id: string) {
  const { client, user } = await authenticatedClient();
  z.uuid().parse(id);
  const { error } = await client
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("Could not delete the tag. Try again.");
  revalidatePath("/");
}
