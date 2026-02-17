import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Priority } from "@/types";

const priorityLabels: Record<number, string> = {
  1: "Low",
  2: "Med",
  3: "High",
};

const priorityColors: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  2: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  3: "bg-red-500/10 text-red-600 border-red-500/20",
};

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

  // Fetch active wishlist items (RLS public share policy allows this)
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
    .order("priority", { ascending: false });

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
                            ${currentPrice.toFixed(2)}
                          </span>
                        )}
                        {originalPrice != null &&
                          currentPrice != null &&
                          originalPrice !== currentPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                      </div>
                      {item.store && (
                        <span className="text-xs text-muted-foreground">
                          {item.store}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.priority > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${priorityColors[item.priority as Priority] ?? ""}`}
                        >
                          {priorityLabels[item.priority] ?? ""}
                        </Badge>
                      )}
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
