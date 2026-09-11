"use client";
import { useSearchParams } from "next/navigation";
import type { ViewMode } from "@/types";

export function useWorkspaceNavigation() {
  const params = useSearchParams();
  const rawView = params.get("view");
  const view: ViewMode =
    rawView === "purchased" || rawView === "settings" ? rawView : "wishlist";
  function update(
    patch: Record<string, string | null>,
    replace = false,
    itemEntry = false,
  ) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href === window.location.href) return;
    window.history[replace ? "replaceState" : "pushState"](
      { wantioItem: itemEntry ? patch.item : null },
      "",
      url.pathname + url.search + url.hash,
    );
  }
  function hrefFor(next: ViewMode) {
    const p = new URLSearchParams(params.toString());
    if (next === "wishlist") p.delete("view");
    else p.set("view", next);
    p.delete("item");
    return p.size ? `/?${p}` : "/";
  }
  return {
    view,
    search: params.get("q") || "",
    tag: params.get("tag") || "",
    itemId: params.get("item"),
    hrefFor,
    changeView(next: ViewMode) {
      update({ view: next === "wishlist" ? null : next, item: null });
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    searchFor(q: string) {
      update({ q, item: null }, true);
    },
    filterBy(tag: string) {
      update({ tag, item: null });
    },
    clearFilters() {
      update({ q: null, tag: null });
    },
    openItem(id: string) {
      update({ item: id }, false, true);
    },
    closeItem(replace = false) {
      if (
        !replace &&
        window.history.state?.wantioItem ===
          new URL(window.location.href).searchParams.get("item")
      )
        window.history.back();
      else update({ item: null }, true);
    },
  };
}
