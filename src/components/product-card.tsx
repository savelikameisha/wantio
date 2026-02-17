"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

interface MenuPosition {
  top: number;
  left: number;
}

export function ProductCard({
  item,
  onMarkPurchased,
  onDelete,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const priceChange =
    item.original_price && item.current_price
      ? item.current_price - item.original_price
      : 0;
  const priceChangePercent =
    item.original_price && priceChange
      ? Math.round((priceChange / item.original_price) * 100)
      : 0;

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 176; // w-44 = 11rem = 176px
    const menuHeight = item.url ? 132 : 88; // approx height based on items

    // Position above the button, aligned to the right edge
    let top = rect.top - menuHeight - 6 + window.scrollY;
    let left = rect.right - menuWidth + window.scrollX;

    // If menu would go above viewport, show below the button instead
    if (rect.top - menuHeight - 6 < 0) {
      top = rect.bottom + 6 + window.scrollY;
    }

    // If menu would go off the left edge, align to left edge of button
    if (left < 8) {
      left = rect.left + window.scrollX;
    }

    // If menu would go off the right edge
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8 + window.scrollX;
    }

    setMenuPos({ top, left });
  }, [item.url]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleScroll = () => setMenuOpen(false);
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen) {
      updateMenuPosition();
    }
    setMenuOpen(!menuOpen);
  };

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
          <div className="absolute bottom-3 right-3">
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-white/90 text-black hover:bg-white transition-colors shadow-md"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Portal dropdown menu — rendered at body level */}
      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-44 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-black/10 dark:border-white/10 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: menuPos.top, left: menuPos.left, position: "absolute" }}
          >
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
          </div>,
          document.body
        )}
    </div>
  );
}
