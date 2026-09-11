"use client";

import { useRef, useState, useTransition } from "react";
import { Heart, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkspaceMenu } from "@/components/workspace-nav";
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
const workspaceContainer = "mx-auto w-full max-w-6xl px-4";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const { view: activeView, search, itemId: detailId } = navigation;
  const expandedSearch = activeView === "wishlist" && (searchOpen || !!search);
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
  const matching = active.filter((i) =>
    [i.name, i.store, ...i.tags.map((t) => t.name)].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const filtered = matching.filter(
    (i) => !filter || i.tags.some((t) => t.id === filter),
  );
  const tagCounts = Object.fromEntries(
    initialTags.map((t) => [
      t.id,
      matching.filter((i) => i.tags.some((tag) => tag.id === t.id)).length,
    ]),
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
        <div
          className={`${workspaceContainer} flex flex-wrap items-center gap-2 py-3 md:flex-nowrap md:gap-3`}
        >
          <a
            href={navigation.hrefFor("wishlist")}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              navigation.changeView("wishlist");
            }}
            aria-label="Wantio home"
            className={`${expandedSearch ? "hidden md:flex" : "flex"} h-11 w-11 shrink-0 items-center justify-center`}
          >
            <img src="/icon.svg" alt="" className="h-8 w-8" />
          </a>
          {activeView === "wishlist" && (
            <div className="order-2 w-full min-w-0 md:order-none md:w-auto md:flex-1">
              <TagFilters
                tags={initialTags}
                value={filter}
                counts={tagCounts}
                allCount={matching.length}
                onChange={(id) => {
                  navigation.filterBy(id);
                  setLimit(48);
                }}
              />
            </div>
          )}
          {activeView === "wishlist" && (searchOpen || !!search) && (
            <div className="order-first flex min-w-0 flex-1 items-center gap-1 md:order-none md:w-48 md:flex-none">
              <Input
                id="workspace-search"
                aria-label="Search wishlist"
                type="search"
                placeholder="Search"
                autoComplete="off"
                className="min-w-0 bg-muted/60 shadow-none"
                value={search}
                onChange={(e) => {
                  navigation.searchFor(e.target.value);
                  setLimit(48);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && !search) {
                    setSearchOpen(false);
                    requestAnimationFrame(() => searchTrigger.current?.focus());
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={search ? "Clear search" : "Close search"}
                onClick={() => {
                  navigation.searchFor("");
                  setSearchOpen(false);
                  requestAnimationFrame(() => searchTrigger.current?.focus());
                }}
              >
                <X />
              </Button>
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {activeView === "wishlist" && (
              <Button
                ref={searchTrigger}
                className={`${expandedSearch ? "hidden" : ""} rounded-full text-muted-foreground hover:text-foreground [&_svg]:size-[18px]`}
                variant="ghost"
                size="icon"
                aria-label="Open search"
                aria-expanded={searchOpen || !!search}
                onClick={() => {
                  setSearchOpen(true);
                  requestAnimationFrame(() =>
                    document.getElementById("workspace-search")?.focus(),
                  );
                }}
              >
                <Search />
              </Button>
            )}
            <WorkspaceMenu
              activeView={activeView}
              onNavigate={navigation.changeView}
            />
            <Button
              className="ml-2 rounded-full px-3.5 shadow-none [&_svg]:size-[18px]"
              aria-label="Add item"
              onClick={() => setModal({})}
            >
              <Plus />
              <span className="hidden sm:inline">Add item</span>
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className={`${workspaceContainer} py-6 pb-10`}>
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
            <h1 className="sr-only">Your wishlist</h1>
            <p className="sr-only" aria-live="polite">
              {filtered.length} items
            </p>
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
