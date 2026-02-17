"use client";

import { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  Trash2,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WishlistItem, Priority } from "@/types";

interface ProductCardProps {
  item: WishlistItem;
  onMarkPurchased?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPriorityChange?: (id: string, priority: Priority) => void;
}

export function ProductCard({
  item,
  onMarkPurchased,
  onDelete,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const priceChange =
    item.original_price && item.current_price
      ? item.current_price - item.original_price
      : 0;
  const priceChangePercent =
    item.original_price && priceChange
      ? Math.round((priceChange / item.original_price) * 100)
      : 0;

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div
      className="group relative break-inside-avoid mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
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

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl transition-opacity duration-200",
            "bg-gradient-to-t from-black/70 via-black/20 to-transparent",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Top: name + price */}
          <div className="absolute top-0 left-0 right-0 p-3">
            <h3 className="font-semibold text-white text-sm leading-tight truncate drop-shadow-sm">
              {item.name}
            </h3>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              {item.current_price != null && (
                <span className="font-bold text-white text-base drop-shadow-sm">
                  ${item.current_price.toFixed(2)}
                </span>
              )}
              {item.original_price != null &&
                item.current_price != null &&
                item.original_price !== item.current_price && (
                  <span className="text-[11px] text-white/50 line-through">
                    ${item.original_price.toFixed(2)}
                  </span>
                )}
            </div>
          </div>

          {/* Bottom: action menu button */}
          <div className="absolute bottom-3 right-3" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-white/90 text-black hover:bg-white transition-colors shadow-md"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute bottom-11 right-0 w-44 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-black/10 dark:border-white/10 overflow-hidden z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkPurchased?.(item.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4 text-neutral-500" />
                  Purchased
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(item.id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-neutral-500" />
                    Open link
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
