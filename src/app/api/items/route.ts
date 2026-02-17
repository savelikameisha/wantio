import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  // 1. Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // 2. Create Supabase client with user's token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // 3. Verify user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // 4. Parse request body
  const body = await request.json();
  const { name, url, image_url, current_price, store, notes, currency, tagIds } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    // 5. Insert wishlist item
    const { data: item, error } = await supabase
      .from("wishlist_items")
      .insert({
        user_id: user.id,
        name,
        url: url || null,
        image_url: image_url || null,
        current_price: current_price ?? null,
        original_price: current_price ?? null,
        store: store || null,
        notes: notes || null,
        currency: currency || "USD",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 6. Insert tag associations
    if (tagIds && tagIds.length > 0) {
      await supabase.from("item_tags").insert(
        tagIds.map((tagId: string) => ({ item_id: item.id, tag_id: tagId }))
      );
    }

    // 7. Record initial price in history
    if (current_price) {
      await supabase.from("price_history").insert({
        item_id: item.id,
        price: current_price,
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
