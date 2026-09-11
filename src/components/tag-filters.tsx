"use client";
import { useId } from "react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";
export function TagFilters({
  tags,
  value,
  onChange,
  counts,
  allCount,
}: {
  tags: Tag[];
  value: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
  allCount?: number;
}) {
  const prefix = useId();
  const buttonClass = (selected: boolean) =>
    cn(
      "relative inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  function count(n: number | undefined, id: string) {
    return n === undefined ? null : (
      <span id={id} className="text-xs tabular-nums opacity-70">
        {n}
        <span className="sr-only"> items</span>
      </span>
    );
  }
  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className="flex min-w-0 items-center gap-1"
    >
      <button
        type="button"
        aria-label="All"
        aria-describedby={allCount === undefined ? undefined : `${prefix}-all`}
        aria-pressed={!value}
        onClick={() => onChange("")}
        className={buttonClass(!value)}
      >
        All{count(allCount, `${prefix}-all`)}
      </button>
      <div className="flex min-w-0 gap-1 overflow-x-auto px-1 py-1">
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.name}
            aria-describedby={counts ? `${prefix}-${t.id}` : undefined}
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
            {count(counts?.[t.id], `${prefix}-${t.id}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
