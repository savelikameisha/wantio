"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FloatingNav } from "@/components/floating-nav";
import { ProductCard } from "@/components/product-card";
import { AddItemModal } from "@/components/add-item-modal";
import { PurchasedView } from "@/components/purchased-view";
import { SettingsView } from "@/components/settings-view";
import { BottomSheet } from "@/components/bottom-sheet";
import { ItemDetailSheet } from "@/components/item-detail-sheet";
import { markPurchased, deleteItem, restoreItem } from "@/lib/actions";
import { errorMessage } from "@/lib/validation";
import { ViewMode, WishlistItem, Tag, Profile } from "@/types";
export function WishlistDashboard({
  initialItems,
  initialTags,
  profile,
}: {
  initialItems: WishlistItem[];
  initialTags: Tag[];
  profile: Profile | null;
}) {
  const [activeView, setActiveView] = useState<ViewMode>("wishlist");
  const [modal, setModal] = useState<{ item?: WishlistItem } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [limit, setLimit] = useState(48);
  // Server props are the source of truth. Revalidation updates cards and tag IDs.
  const active = initialItems.filter((i) => !i.is_purchased && !i.is_archived);
  const purchased = initialItems.filter(
    (i) => i.is_purchased && !i.is_archived,
  );
  const filtered = active.filter(
    (i) =>
      (!filter || i.tags.some((t) => t.id === filter)) &&
      [i.name, i.store, ...i.tags.map((t) => t.name)].some((v) =>
        v?.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const detail = initialItems.find((i) => i.id === detailId);
  function mutate(action: () => Promise<void>) {
    if (pending) return;
    setError("");
    startTransition(async () => {
      try {
        await action();
        setDetailId(null);
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }
  function remove(id: string) {
    if (window.confirm("Delete this item from your wishlist?"))
      mutate(() => deleteItem(id));
  }
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:block p-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <Link
            href="/"
            className="flex items-center gap-2 min-h-11 font-semibold text-lg"
          >
            <img src="/icon.svg" alt="" className="h-8 w-8" />
            Wantio
          </Link>
          {activeView === "wishlist" && (
            <>
              <label className="flex-1 min-w-36">
                <span className="sr-only">Search wishlist</span>
                <Input
                  type="search"
                  placeholder="Search your wishlist"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(48);
                  }}
                />
              </label>
              <label>
                <span className="sr-only">Filter by tag</span>
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setLimit(48);
                  }}
                  className="h-11 max-w-40 rounded-lg border bg-background px-3"
                >
                  <option value="">All tags</option>
                  {initialTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </header>
      <main id="main" className="max-w-6xl mx-auto px-4 py-6 pb-32">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {pending && (
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            Saving changes…
          </p>
        )}
        {activeView === "wishlist" && (
          <>
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-semibold">
                Your wishlist{" "}
                <span className="text-muted-foreground text-sm">
                  {active.length}
                </span>
              </h1>
              <Button onClick={() => setModal({})}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>
            {!filtered.length ? (
              <div className="text-center py-20">
                <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="font-medium">
                  {active.length
                    ? "No matching items"
                    : "Make room for your next favorite"}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {active.length
                    ? "Try another search or tag."
                    : "Save a link or add something you love."}
                </p>
                {active.length > 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearch("");
                      setFilter("");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.slice(0, limit).map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onTap={(i) => setDetailId(i.id)}
                    />
                  ))}
                </div>
                {filtered.length > limit && (
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setLimit((l) => l + 48)}
                  >
                    Show more
                  </Button>
                )}
              </>
            )}
          </>
        )}
        {activeView === "purchased" && (
          <PurchasedView items={purchased} onOpen={(i) => setDetailId(i.id)} />
        )}
        {activeView === "settings" && (
          <SettingsView
            tags={initialTags}
            profile={profile}
            items={initialItems}
          />
        )}
      </main>
      <FloatingNav
        activeView={activeView}
        onViewChange={setActiveView}
        onAddItem={() => setModal({})}
      />
      {modal && (
        <AddItemModal
          key={modal.item?.id || "new"}
          open
          onClose={() => setModal(null)}
          availableTags={initialTags}
          editItem={modal.item}
          defaultCurrency={profile?.currency || "USD"}
        />
      )}
      <BottomSheet open={!!detail} onClose={() => setDetailId(null)}>
        {detail && error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {detail && (
          <ItemDetailSheet
            key={detail.id}
            item={detail}
            pending={pending}
            onEdit={(item) => {
              setDetailId(null);
              setModal({ item });
            }}
            onMarkPurchased={(id, price) =>
              mutate(() => markPurchased(id, price))
            }
            onRestore={(id) => mutate(() => restoreItem(id))}
            onDelete={remove}
          />
        )}
      </BottomSheet>
    </div>
  );
}
