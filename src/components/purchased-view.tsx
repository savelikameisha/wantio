"use client";

import { DollarSign, Package, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistItem } from "@/types";

interface PurchasedViewProps {
  items: WishlistItem[];
}

export function PurchasedView({ items }: PurchasedViewProps) {
  const totalSpent = items.reduce(
    (sum, item) => sum + (item.purchased_price ?? item.current_price ?? 0),
    0
  );
  const totalSaved = items.reduce((sum, item) => {
    const original = item.original_price ?? 0;
    const paid = item.purchased_price ?? item.current_price ?? 0;
    return sum + Math.max(0, original - paid);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4 border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500/10">
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Saved</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                ${totalSaved.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/50 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Items Bought</p>
              <p className="text-lg font-semibold">{items.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Purchased items grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No purchased items yet.</p>
          <p className="text-xs mt-1">
            Items you mark as purchased will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-border/50 opacity-90"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover grayscale-[30%]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-600 text-white text-[10px]">
                    Purchased
                  </Badge>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-medium text-sm leading-tight line-clamp-2">
                  {item.name}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-semibold text-sm">
                    $
                    {(
                      item.purchased_price ??
                      item.current_price ??
                      0
                    ).toFixed(2)}
                  </span>
                  {item.original_price != null &&
                    item.purchased_price != null &&
                    item.original_price > item.purchased_price && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        saved $
                        {(item.original_price - item.purchased_price).toFixed(2)}
                      </span>
                    )}
                </div>
                {item.purchased_at && (
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(item.purchased_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
