"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "./image-with-fallback";
import { WishlistItem } from "@/types";
import { formatMoney } from "@/lib/price";
export function ItemDetailSheet({
  item,
  pending,
  onEdit,
  onMarkPurchased,
  onRestore,
  onDelete,
}: {
  item: WishlistItem;
  pending: boolean;
  onEdit: (item: WishlistItem) => void;
  onMarkPurchased: (id: string, price?: number) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [paid, setPaid] = useState(
    (item.purchased_price ?? item.current_price)?.toString() || "",
  );
  return (
    <div className="space-y-4">
      <ImageWithFallback src={item.image_url} alt={item.name} />
      <div>
        <h2 className="text-xl font-semibold">{item.name}</h2>
        <p className="text-lg font-medium tabular-nums mt-1">
          {item.current_price != null
            ? formatMoney(item.current_price, item.currency)
            : "Price not set"}
        </p>
        <p className="text-sm text-muted-foreground">{item.store}</p>
      </div>
      {item.notes && (
        <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
      )}
      {item.url && /^https?:\/\//i.test(item.url) && (
        <Button asChild className="w-full">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            Open store
          </a>
        </Button>
      )}
      <Button
        variant="outline"
        disabled={pending}
        className="w-full"
        onClick={() => onEdit(item)}
      >
        Edit item
      </Button>
      <form
        className="space-y-2 border-t pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          onMarkPurchased(item.id, paid === "" ? undefined : Number(paid));
        }}
      >
        <label htmlFor="paid-price" className="text-sm font-medium">
          {item.is_purchased ? "Price paid" : "Purchase price"} (
          {item.currency || "USD"})
        </label>
        <Input
          id="paid-price"
          type="number"
          step="0.01"
          min="0"
          max="9999999999.99"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
        />
        <Button
          type="submit"
          disabled={pending}
          variant="outline"
          className="w-full"
        >
          {item.is_purchased ? "Update price paid" : "Mark as purchased"}
        </Button>
      </form>
      {item.is_purchased && (
        <Button
          variant="outline"
          disabled={pending}
          className="w-full"
          onClick={() => onRestore(item.id)}
        >
          Move back to wishlist
        </Button>
      )}
      <Button
        variant="ghost"
        disabled={pending}
        className="w-full text-destructive"
        onClick={() => onDelete(item.id)}
      >
        Delete item
      </Button>
    </div>
  );
}
