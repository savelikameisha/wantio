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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Wantry</h1>
          <div className="flex items-center gap-2">
            {activeView === "wishlist" && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 w-48 md:w-64 text-sm bg-muted/50 border-transparent focus:border-border"
                />
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-28">
        {activeView === "wishlist" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
