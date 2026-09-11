"use client";
import { useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ViewMode } from "@/types";
export function WorkspaceNav({
  activeView,
  onNavigate,
}: {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}) {
  return (
    <Select
      value={activeView === "settings" ? "" : activeView}
      onValueChange={(v) => onNavigate(v as ViewMode)}
    >
      <SelectTrigger
        aria-label="Choose list"
        className="h-11 w-auto min-w-28 gap-2 border-0 bg-transparent px-2 shadow-none"
      >
        <SelectValue placeholder="Settings" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="wishlist" className="min-h-11">
          Wishlist
        </SelectItem>
        <SelectItem value="purchased" className="min-h-11">
          Purchased
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
export function WorkspaceMenu({ onSettings }: { onSettings: () => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        ref.current.open = false;
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const row =
    "flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted";
  return (
    <details ref={ref} className="relative shrink-0">
      <summary
        aria-label="More options"
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl hover:bg-muted [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal className="h-5 w-5" />
      </summary>
      <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border bg-popover p-1.5 shadow-lg">
        <button
          className={row}
          onClick={() => {
            if (ref.current) ref.current.open = false;
            onSettings();
          }}
        >
          Settings
        </button>
        <a className={row} href="/extension">
          Chrome extension
        </a>
        <div className="my-1 border-t" />
        <form action="/auth/signout" method="post">
          <button className={row} type="submit">
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
