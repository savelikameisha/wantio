"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Heart, Plus, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FloatingNav } from "@/components/floating-nav";
import { ProductCard } from "@/components/product-card";
import { AddItemModal } from "@/components/add-item-modal";
import { PurchasedView } from "@/components/purchased-view";
import { SettingsView } from "@/components/settings-view";
import { BottomSheet } from "@/components/bottom-sheet";
import { ItemDetailSheet } from "@/components/item-detail-sheet";
import {
  markPurchased,
  deleteItem,
} from "@/lib/actions";
import { ViewMode, WishlistItem, Tag, Profile } from "@/types";

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
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItem | null>(null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);

  const activeItems = items.filter((item) => !item.is_purchased);
  const purchasedItems = items.filter((item) => item.is_purchased);

  const filteredItems = activeItems.filter((item) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Tag filter (OR logic — show items matching any selected tag)
    const matchesTags =
      selectedFilterTags.length === 0 ||
      item.tags.some((tag) => selectedFilterTags.includes(tag.id));

    return matchesSearch && matchesTags;
  });

  const toggleFilterTag = (tagId: string) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilterTags([]);
  };

  const handleMarkPurchased = async (id: string) => {
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
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteItem(id);
    } catch {
      if (deletedItem) {
        setItems((prev) => [...prev, deletedItem]);
      }
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setAddModalOpen(true);
  };

  const handleModalClose = () => {
    setAddModalOpen(false);
    setEditingItem(null);
  };

  const hasActiveFilters = searchQuery || selectedFilterTags.length > 0;
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Close tag dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tag pill label
  const tagPillLabel = selectedFilterTags.length === 0
    ? `All (${activeItems.length})`
    : selectedFilterTags.length <= 2
      ? selectedFilterTags
          .map((id) => initialTags.find((t) => t.id === id)?.name)
          .filter(Boolean)
          .join(", ")
      : `${selectedFilterTags.length} tags`;

  return (
    <div className="min-h-screen bg-background">
      {/* Clean single-row header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="w-full px-4 py-3 flex items-center gap-3">
          {/* Logo — icon only, spin on hover */}
          <img src="/icon.svg" alt="Wantry" className="h-9 w-9 shrink-0 cursor-pointer logo-spin" />

          {/* Tags dropdown pill */}
          {activeView === "wishlist" && initialTags.length > 0 && (
            <div className="relative shrink-0" ref={tagDropdownRef}>
              <button
                onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                onMouseEnter={() => setTagDropdownOpen(true)}
                className={`h-11 px-4 flex items-center gap-2 text-sm font-medium rounded-full border transition-colors ${
                  selectedFilterTags.length > 0
                    ? "border-primary/50 text-primary bg-primary/5"
                    : "border-border text-foreground hover:border-foreground/30"
                }`}
              >
                {tagPillLabel}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${tagDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {tagDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50">
                  {/* All option */}
                  <button
                    onClick={() => { setSelectedFilterTags([]); setTagDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                      selectedFilterTags.length === 0 ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {selectedFilterTags.length === 0 && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="font-medium">All</span>
                    <span className="text-muted-foreground ml-auto text-xs">({activeItems.length})</span>
                  </button>

                  <div className="h-px bg-border mx-2 my-1" />

                  {/* Tag options */}
                  {initialTags.map((tag) => {
                    const isSelected = selectedFilterTags.includes(tag.id);
                    const count = activeItems.filter((item) =>
                      item.tags.some((t) => t.id === tag.id)
                    ).length;
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleFilterTag(tag.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                          isSelected ? "border-transparent" : "border-border"
                        }`} style={isSelected ? { backgroundColor: tag.color } : {}}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                        <span className="text-muted-foreground ml-auto text-xs">({count})</span>
                      </button>
                    );
                  })}

                  {/* Clear selection */}
                  {selectedFilterTags.length > 0 && (
                    <>
                      <div className="h-px bg-border mx-2 my-1" />
                      <button
                        onClick={() => { setSelectedFilterTags([]); setTagDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear filters
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full-width search bar */}
          {activeView === "wishlist" && (
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 w-full text-sm bg-muted/50 border-transparent rounded-full focus:border-border focus:bg-background"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-4 py-6 pb-28">
        {activeView === "wishlist" && (
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              activeItems.length === 0 && !hasActiveFilters ? (
                /* Empty wishlist — onboarding */
                <div className="text-center py-24 max-w-sm mx-auto">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Heart className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    Your wishlist is empty
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Start by adding items you want to keep track of. Paste a URL
                    or add details manually.
                  </p>
                  <Button onClick={() => setAddModalOpen(true)} className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Item
                  </Button>
                </div>
              ) : (
                /* No results matching filters */
                <div className="text-center py-20 text-muted-foreground">
                  <p className="text-sm mb-3">
                    No items match your{" "}
                    {searchQuery && selectedFilterTags.length > 0
                      ? "search and filters"
                      : searchQuery
                        ? "search"
                        : "filters"}
                    .
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                </div>
              )
            ) : (
              <div className="max-w-[1800px] mx-auto columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
                {filteredItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onMarkPurchased={handleMarkPurchased}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onTap={setDetailItem}
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

      {/* Add/edit item modal */}
      <AddItemModal
        open={addModalOpen}
        onClose={handleModalClose}
        availableTags={initialTags}
        editItem={editingItem}
      />

      {/* Bottom sheet for mobile detail view */}
      <BottomSheet
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      >
        {detailItem && (
          <ItemDetailSheet
            item={detailItem}
            onEdit={handleEdit}
            onMarkPurchased={handleMarkPurchased}
            onDelete={handleDelete}
            onClose={() => setDetailItem(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
