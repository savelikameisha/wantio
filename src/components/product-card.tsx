"use client";

import { useState } from "react";
import {
  ExternalLink,
  Trash2,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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

const priorityColors: Record<Priority, string> = {
  0: "",
  1: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  3: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
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
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 border-border/50 hover:border-border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Price change indicator */}
        {priceChange !== 0 && (
          <div
            className={cn(
              "absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
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

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Priority selector */}
          <div className="flex items-center gap-1">
            {([1, 2, 3] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => onPriorityChange?.(item.id, p === item.priority ? 0 : p)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  item.priority === p
                    ? "bg-white text-black border-white"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                )}
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>

          {/* Sparkline */}
          {item.price_history.length >= 2 && (
            <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
              <Sparkline
                data={item.price_history}
                width={100}
                height={32}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMarkPurchased?.(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" />
              Purchased
            </button>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => onDelete?.(item.id)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-red-500/80 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {item.name}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {item.current_price != null && (
              <span className="font-semibold text-base">
                ${item.current_price.toFixed(2)}
              </span>
            )}
            {item.original_price != null &&
              item.current_price != null &&
              item.original_price !== item.current_price && (
                <span className="text-xs text-muted-foreground line-through">
                  ${item.original_price.toFixed(2)}
                </span>
              )}
          </div>
          {item.store && (
            <span className="text-xs text-muted-foreground">{item.store}</span>
          )}
        </div>

        {/* Tags & Priority */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.priority > 0 && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", priorityColors[item.priority])}
            >
              {priorityLabels[item.priority]}
            </Badge>
          )}
          {item.tags.map((tag) => (
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
}
