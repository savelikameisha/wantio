import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrencySymbol } from "@/lib/utils";

export default async function SharedWishlistPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Find the user profile by public share ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, public_share_enabled")
    .eq("public_share_id", params.id)
    .single();

  if (!profile || !profile.public_share_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Wishlist not found</p>
          <p className="text-xs mt-1">
            This wishlist doesn&apos;t exist or is no longer shared.
          </p>
        </div>
      </div>
    );
  }

  // Fetch active wishlist items
  const { data: items } = await supabase
    .from("wishlist_items")
    .select(
      `
      *,
      item_tags(tags(*))
    `
    )
    .eq("user_id", profile.id)
    .eq("is_purchased", false)
    .order("created_at", { ascending: false });

  const wishlistItems = items ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">
            {profile.display_name
              ? `${profile.display_name}'s Wishlist`
              : "Shared Wishlist"}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">This wishlist is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {wishlistItems.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tags = (item.item_tags ?? []).map((it: any) => it.tags).filter(Boolean);
              const currentPrice = item.current_price ? Number(item.current_price) : null;
              const originalPrice = item.original_price ? Number(item.original_price) : null;
              const currSymbol = getCurrencySymbol(item.currency);

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden border-border/50"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        {currentPrice != null && (
                          <span className="font-semibold text-base">
                            {currSymbol}{currentPrice.toFixed(2)}
                          </span>
                        )}
                        {originalPrice != null &&
                          currentPrice != null &&
                          originalPrice !== currentPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {currSymbol}{originalPrice.toFixed(2)}
                            </span>
                          )}
                      </div>
                      {item.store && (
                        <span className="text-xs text-muted-foreground">
                          {item.store}
                        </span>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tags.map((tag: { id: string; name: string; color: string }) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: `${tag.color}15`,
                              color: tag.color,
                              borderColor: `${tag.color}30`,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
