import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/price";
import { ImageWithFallback } from "@/components/image-with-fallback";
const sharedSchema = z.object({
  display_name: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string().nullable(),
      image_url: z.string().nullable(),
      current_price: z.number().nullable(),
      currency: z.string(),
      store: z.string().nullable(),
      tags: z.array(
        z.object({ id: z.string(), name: z.string(), color: z.string() }),
      ),
    }),
  ),
});
export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const { data, error } = await client.rpc("get_shared_wishlist", {
    p_share_id: id,
  });
  if (error) throw new Error("Could not load this wishlist. Try again.");
  if (!data) notFound();
  const profile = sharedSchema.parse(data);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <Link href="/" className="font-semibold">
            Wantio
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">
          {profile.display_name
            ? `${profile.display_name}'s wishlist`
            : "Shared wishlist"}
        </h1>
        <p className="text-muted-foreground mb-8">
          A few things they would love.
        </p>
        {!profile.items.length ? (
          <p>No items to share yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {profile.items.map((i) => (
              <article
                key={i.id}
                className="rounded-xl border overflow-hidden bg-card"
              >
                <ImageWithFallback src={i.image_url} alt={i.name} />
                <div className="p-4 space-y-2">
                  <h2 className="font-medium">{i.name}</h2>
                  {i.current_price != null && (
                    <p className="tabular-nums">
                      {formatMoney(i.current_price, i.currency)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{i.store}</p>
                  {!!i.tags.length && (
                    <p className="text-xs text-muted-foreground">
                      {i.tags.map((t) => t.name).join(" · ")}
                    </p>
                  )}
                  {i.url && /^https?:\/\//i.test(i.url) && (
                    <a
                      href={i.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="inline-flex items-center min-h-11 text-sm font-medium underline underline-offset-4"
                    >
                      Open store
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
