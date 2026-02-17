"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FloatingNav } from "@/components/floating-nav";
import { ProductCard } from "@/components/product-card";
import { AddItemModal } from "@/components/add-item-modal";
import { PurchasedView } from "@/components/purchased-view";
import { SettingsView } from "@/components/settings-view";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  markPurchased,
  deleteItem,
  updatePriority,
} from "@/lib/actions";
import { ViewMode, WishlistItem, Tag, Profile, Priority } from "@/types";

interface WishlistDashboardProps {
  initialItems: WishlistItem[];
  initialTags: Tag[];
  profile: Profile | null;
}

export function WishlistDashboard({
  initialItems,
  initialTags,
  profile,
}: WishlistDashboardProps) {
  const [activeView, setActiveView] = useState<ViewMode>("wishlist");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");

  const activeItems = items.filter((item) => !item.is_purchased);
  const purchasedItems = items.filter((item) => item.is_purchased);

  const filteredItems = activeItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleMarkPurchased = async (id: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              is_purchased: true,
              purchased_at: new Date().toISOString(),
              purchased_price: item.current_price,
            }
          : item
      )
    );

    try {
      await markPurchased(id);
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_purchased: false,
                purchased_at: undefined,
                purchased_price: undefined,
              }
            : item
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    const deletedItem = items.find((item) => item.id === id);
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteItem(id);
    } catch {
      // Revert on failure
      if (deletedItem) {
        setItems((prev) => [...prev, deletedItem]);
      }
    }
  };

  const handlePriorityChange = async (id: string, priority: Priority) => {
    const prevPriority = items.find((item) => item.id === id)?.priority;
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, priority } : item
      )
    );

    try {
      await updatePriority(id, priority);
    } catch {
      // Revert on failure
      if (prevPriority !== undefined) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, priority: prevPriority } : item
          )
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Pinterest-style search header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="w-full px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="text-base font-semibold tracking-tight hidden sm:block">
              Wantry
            </span>
          </div>

          {/* Full-width search bar */}
          {activeView === "wishlist" && (
            <div className="relative flex-1 max-w-3xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 w-full text-sm bg-muted/50 border-transparent rounded-full focus:border-border focus:bg-background"
              />
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-4 py-6 pb-28">
        {activeView === "wishlist" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between max-w-[1800px] mx-auto">
              <h2 className="text-sm font-medium text-muted-foreground">
                {filteredItems.length} item
                {filteredItems.length !== 1 ? "s" : ""} on your wishlist
              </h2>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-sm">
                  {searchQuery
                    ? "No items match your search."
                    : "Your wishlist is empty. Add your first item!"}
                </p>
              </div>
            ) : (
              <div className="max-w-[1800px] mx-auto columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
                {filteredItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onMarkPurchased={handleMarkPurchased}
                    onDelete={handleDelete}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "purchased" && (
          <PurchasedView items={purchasedItems} />
        )}

        {activeView === "settings" && (
          <SettingsView tags={initialTags} profile={profile} />
        )}
      </main>

      {/* Floating navigation */}
      <FloatingNav
        activeView={activeView}
        onViewChange={setActiveView}
        onAddItem={() => setAddModalOpen(true)}
      />

      {/* Add item modal */}
      <AddItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        availableTags={initialTags}
      />
    </div>
  );
}
