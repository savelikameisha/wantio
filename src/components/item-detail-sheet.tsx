"use client";

import {
  ExternalLink,
  ShoppingCart,
  Trash2,
  Pencil,
  Store,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { getCurrencySymbol } from "@/lib/utils";
import { WishlistItem } from "@/types";

interface ItemDetailSheetProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onMarkPurchased: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ItemDetailSheet({
  item,
  onEdit,
  onMarkPurchased,
  onDelete,
  onClose,
}: ItemDetailSheetProps) {
  const currSymbol = getCurrencySymbol(item.currency);
  const priceChange =
    item.original_price && item.current_price
      ? item.current_price - item.original_price
      : 0;
  const priceChangePercent =
    item.original_price && priceChange
      ? Math.round((priceChange / item.original_price) * 100)
      : 0;

  return (
    <div className="pb-8">
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-muted">
        <ImageWithFallback
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
          fallbackClassName="w-full aspect-[4/3]"
        />
      </div>

      {/* Details */}
      <div className="px-5 pt-4 space-y-4">
        {/* Name + Price */}
        <div>
          <h2 className="text-lg font-semibold leading-tight">{item.name}</h2>
          <div className="flex items-baseline gap-2 mt-1">
            {item.current_price != null && (
              <span className="text-xl font-bold">
                {currSymbol}
                {item.current_price.toFixed(2)}
              </span>
            )}
            {item.original_price != null &&
              item.current_price != null &&
              item.original_price !== item.current_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {currSymbol}
                  {item.original_price.toFixed(2)}
                </span>
              )}
            {priceChange !== 0 && (
              <span
                className={`text-xs font-medium ${
                  priceChange < 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {priceChange < 0 ? "" : "+"}
                {priceChangePercent}%
              </span>
            )}
          </div>
        </div>

        {/* Store */}
        {item.store && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>{item.store}</span>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs"
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

        {/* Notes */}
        {item.notes && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{item.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              onEdit(item);
              onClose();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              onMarkPurchased(item.id);
              onClose();
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchased
          </Button>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2"
            >
              <Button variant="default" className="w-full h-11">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Product
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            className="col-span-2 h-11 text-muted-foreground hover:text-destructive"
            onClick={() => {
              onDelete(item.id);
              onClose();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
