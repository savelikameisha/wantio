"use client";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";
export function TagFilters({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: string;
  onChange: (id: string) => void;
}) {
  const buttonClass = (selected: boolean) =>
    cn(
      "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className="flex min-w-0 items-center gap-2"
    >
      <button
        type="button"
        aria-pressed={!value}
        onClick={() => onChange("")}
        className={buttonClass(!value)}
      >
        All
      </button>
      <div className="flex min-w-0 gap-2 overflow-x-auto px-1 py-2">
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={value === t.id}
            onClick={() => onChange(t.id)}
            onFocus={(e) =>
              e.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "nearest",
              })
            }
            className={buttonClass(value === t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
