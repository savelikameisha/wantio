"use client";
import { WishlistItem } from "@/types";
import { groupPurchases, formatMoney } from "@/lib/price";
import { ProductCard } from "./product-card";
export function PurchasedView({
  items,
  onOpen,
}: {
  items: WishlistItem[];
  onOpen: (item: WishlistItem) => void;
}) {
  const groups = groupPurchases(items);
  return (
    <section className="space-y-5">
      <h1 className="text-xl font-semibold">
        Purchased{" "}
        <span className="text-sm text-muted-foreground">{items.length}</span>
      </h1>
      <div className="flex flex-wrap gap-3">
        {Object.entries(groups).map(([currency, v]) => (
          <div key={currency} className="rounded-xl border p-4 bg-card">
            <p className="text-xs text-muted-foreground">Spent · {currency}</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(v.spent, currency)}
            </p>
            {v.saved > 0 && (
              <p className="text-sm text-muted-foreground">
                Saved {formatMoney(v.saved, currency)}
              </p>
            )}
          </div>
        ))}
      </div>
      {!items.length ? (
        <p className="py-16 text-center text-muted-foreground">
          Your purchases will appear here.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((i) => (
            <ProductCard
              key={i.id}
              item={{
                ...i,
                current_price: i.purchased_price ?? i.current_price,
              }}
              onTap={() => onOpen(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
