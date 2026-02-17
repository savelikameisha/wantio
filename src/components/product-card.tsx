"use client";

import { useState } from "react";
import {
  ExternalLink,
  Trash2,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WishlistItem, Priority } from "@/types";
import { Sparkline } from "./sparkline";

interface ProductCardProps {
  item: WishlistItem;
  onMarkPurchased?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPriorityChange?: (id: string, priority: Priority) => void;
}

const priorityLabels: Record<Priority, string> = {
  0: "",
  1: "Low",
  2: "Med",
  3: "High",
};


export function ProductCard({
  item,
  onMarkPurchased,
  onDelete,
  onPriorityChange,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const priceChange =
    item.original_price && item.current_price
      ? item.current_price - item.original_price
      : 0;
  const priceChangePercent =
    item.original_price && priceChange
      ? Math.round((priceChange / item.original_price) * 100)
      : 0;

  return (
    <div
      className="group relative break-inside-avoid mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container — natural aspect ratio */}
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full block transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Always-visible: price change pill */}
        {priceChange !== 0 && !isHovered && (
          <div
            className={cn(
              "absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm",
              priceChange < 0
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            )}
          >
            {priceChange < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {Math.abs(priceChangePercent)}%
          </div>
        )}

        {/* Hover overlay — all info + actions */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl transition-opacity duration-200",
            "bg-gradient-to-t from-black/80 via-black/40 to-black/10",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Top actions */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-8 w-8 rounded-full bg-white/90 text-black hover:bg-white transition-colors shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => onDelete?.(item.id)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white/90 text-black hover:bg-red-500 hover:text-white transition-colors shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Name + price */}
            <div>
              <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 drop-shadow-sm">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {item.current_price != null && (
                  <span className="font-bold text-white text-lg drop-shadow-sm">
                    ${item.current_price.toFixed(2)}
                  </span>
                )}
                {item.original_price != null &&
                  item.current_price != null &&
                  item.original_price !== item.current_price && (
                    <span className="text-xs text-white/60 line-through">
                      ${item.original_price.toFixed(2)}
                    </span>
                  )}
                {item.store && (
                  <span className="text-xs text-white/60 ml-auto">
                    {item.store}
                  </span>
                )}
              </div>
            </div>

            {/* Tags & priority */}
            {(item.priority > 0 || item.tags.length > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.priority > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 border-white/30 text-white bg-white/10"
                    )}
                  >
                    {priorityLabels[item.priority]}
                  </Badge>
                )}
                {item.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-white/10 text-white border-white/20"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Sparkline + actions row */}
            <div className="flex items-center gap-2">
              {/* Sparkline */}
              {item.price_history.length >= 2 && (
                <div className="bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                  <Sparkline
                    data={item.price_history}
                    width={70}
                    height={24}
                  />
                </div>
              )}

              <div className="flex items-center gap-1.5 ml-auto">
                {/* Priority selector */}
                {([1, 2, 3] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      onPriorityChange?.(item.id, p === item.priority ? 0 : p)
                    }
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-medium transition-all border",
                      item.priority === p
                        ? "bg-white text-black border-white"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    )}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mark purchased button */}
            <button
              onClick={() => onMarkPurchased?.(item.id)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors shadow-sm"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Mark as Purchased
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
