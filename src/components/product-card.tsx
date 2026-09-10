"use client";
import { WishlistItem } from "@/types";
import { ImageWithFallback } from "./image-with-fallback";
import { formatMoney } from "@/lib/price";
export function ProductCard({
  item,
  onTap,
}: {
  item: WishlistItem;
  onTap?: (item: WishlistItem) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <button
        onClick={() => onTap?.(item)}
        className="block w-full text-left"
        aria-label={`View ${item.name}`}
      >
        <ImageWithFallback
          src={item.image_url}
          alt=""
          className="w-full h-full object-contain p-3"
          fallbackClassName="aspect-square w-full"
        />
        <div className="p-3 space-y-1.5">
          <h2 className="font-medium text-sm line-clamp-2 min-h-10">
            {item.name}
          </h2>
          <p className="font-semibold tabular-nums">
            {item.current_price != null
              ? formatMoney(item.current_price, item.currency)
              : "Price not set"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {item.store || "Saved item"}
          </p>
        </div>
      </button>
      {!!item.tags.length && (
        <div className="px-3 pb-3 flex gap-1 flex-wrap">
          {item.tags.map((t) => (
            <span
              key={t.id}
              className="text-xs rounded-full bg-muted px-2 py-1"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
