"use client";

import { useRef, useState, useTransition } from "react";
import { Heart, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkspaceNav } from "@/components/workspace-nav";
import { TagFilters } from "@/components/tag-filters";
import { useWorkspaceNavigation } from "@/hooks/use-workspace-navigation";
import { ProductCard } from "@/components/product-card";
import { AddItemModal } from "@/components/add-item-modal";
import { PurchasedView } from "@/components/purchased-view";
import { SettingsView } from "@/components/settings-view";
import { BottomSheet } from "@/components/bottom-sheet";
import { ItemDetailSheet } from "@/components/item-detail-sheet";
import { markPurchased, deleteItem, restoreItem } from "@/lib/actions";
import { errorMessage } from "@/lib/validation";
import { WishlistItem, Tag, Profile } from "@/types";
export function WishlistDashboard({
  initialItems,
  initialTags,
  profile,
}: {
  initialItems: WishlistItem[];
  initialTags: Tag[];
  profile: Profile | null;
}) {
  const navigation = useWorkspaceNavigation();
  const { view: activeView, search, itemId: detailId } = navigation;
  const filter = initialTags.some((t) => t.id === navigation.tag)
    ? navigation.tag
    : "";
  const itemTrigger = useRef<HTMLElement | null>(null);
  function openDetail(item: WishlistItem) {
    itemTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    navigation.openItem(item.id);
  }
  const [modal, setModal] = useState<{ item?: WishlistItem } | null>(null);
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
        navigation.closeItem(true);
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
    <div data-wantio-workspace className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:block p-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-4">
          <a
            href={navigation.hrefFor("wishlist")}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              navigation.changeView("wishlist");
            }}
            className="flex min-h-11 shrink-0 items-center gap-2 text-lg font-semibold"
          >
            <img src="/icon.svg" alt="" className="h-8 w-8" />
            Wantio
          </a>
          <WorkspaceNav
            activeView={activeView}
            onNavigate={navigation.changeView}
            hrefFor={navigation.hrefFor}
            onAddItem={() => setModal({})}
          />
          <Button
            className="hidden md:inline-flex"
            onClick={() => setModal({})}
          >
            <Plus />
            Add item
          </Button>
        </div>
      </header>
      <main id="main" className="max-w-6xl mx-auto px-4 py-6 pb-28 md:pb-10">
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
            <div className="mb-4 flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Your wishlist
              </h1>
              <span
                className="text-sm tabular-nums text-muted-foreground"
                aria-live="polite"
              >
                {filtered.length}
                {filter || search ? ` of ${active.length}` : ""} items
              </span>
            </div>
            <div className="sticky top-[76px] z-20 -mx-4 mb-4 space-y-2 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
              <label className="relative block max-w-md">
                <span className="sr-only">Search wishlist</span>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                  type="search"
                  className="bg-card pl-10"
                  placeholder="Search your wishlist"
                  value={search}
                  onChange={(e) => {
                    navigation.searchFor(e.target.value);
                    setLimit(48);
                  }}
                />
              </label>
              <TagFilters
                tags={initialTags}
                value={filter}
                onChange={(id) => {
                  navigation.filterBy(id);
                  setLimit(48);
                }}
              />
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
                      navigation.clearFilters();
                      setLimit(48);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {filtered.slice(0, limit).map((item) => (
                    <ProductCard key={item.id} item={item} onTap={openDetail} />
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
          <PurchasedView items={purchased} onOpen={openDetail} />
        )}
        {activeView === "settings" && (
          <SettingsView
            tags={initialTags}
            profile={profile}
            items={initialItems}
          />
        )}
      </main>
      <WorkspaceNav
        mobile
        activeView={activeView}
        onNavigate={navigation.changeView}
        hrefFor={navigation.hrefFor}
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
      <BottomSheet
        open={!!detail}
        onClose={() => navigation.closeItem()}
        onReturnFocus={() => {
          if (itemTrigger.current?.isConnected)
            itemTrigger.current.focus({ preventScroll: true });
        }}
      >
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
              navigation.closeItem(true);
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
