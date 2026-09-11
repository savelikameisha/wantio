"use client";
import { Heart, ShoppingBag, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types";
const views = [
  { id: "wishlist", name: "Wishlist", icon: Heart },
  { id: "purchased", name: "Purchased", icon: ShoppingBag },
  { id: "settings", name: "Settings", icon: Settings },
] as const;
export function WorkspaceNav({
  activeView,
  onNavigate,
  hrefFor,
  onAddItem,
  mobile = false,
}: {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  hrefFor: (view: ViewMode) => string;
  onAddItem: () => void;
  mobile?: boolean;
}) {
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className={cn(
        mobile
          ? "fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
          : "hidden items-center gap-1 md:flex",
      )}
    >
      {views.map(({ id, name, icon: Icon }) => (
        <a
          key={id}
          href={hrefFor(id)}
          aria-current={activeView === id ? "page" : undefined}
          onClick={(e) => {
            if (
              e.metaKey ||
              e.ctrlKey ||
              e.shiftKey ||
              e.altKey ||
              e.button !== 0
            )
              return;
            e.preventDefault();
            onNavigate(id);
          }}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            mobile && "min-w-16 flex-col gap-1 px-3 text-[11px]",
            activeView === id
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {name}
        </a>
      ))}
      {mobile && (
        <button
          onClick={onAddItem}
          className="flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add item
        </button>
      )}
    </nav>
  );
}
