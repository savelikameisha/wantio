"use client";

import { Heart, ShoppingBag, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewMode } from "@/types";

interface FloatingNavProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddItem: () => void;
}

const navItems: { id: ViewMode; label: string; icon: typeof Heart }[] = [
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "purchased", label: "Purchased", icon: ShoppingBag },
  { id: "settings", label: "Settings", icon: Settings },
];

export function FloatingNav({
  activeView,
  onViewChange,
  onAddItem,
}: FloatingNavProps) {
  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {isActive && <span>{item.label}</span>}
            </button>
          );
        })}
        <div className="w-px h-6 bg-border/50 mx-1" />
        <button
          aria-label="Add item"
          onClick={onAddItem}
          className="flex items-center justify-center h-11 w-11 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
