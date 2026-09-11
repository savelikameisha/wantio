"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  Heart,
  Loader2,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagFilters } from "@/components/tag-filters";
import { ProductCard } from "@/components/product-card";
import { BottomSheet } from "@/components/bottom-sheet";
import { ItemDetailSheet } from "@/components/item-detail-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import type { WishlistItem } from "@/types";

const sections = [
  ["logo", "Logo"],
  ["color", "Color"],
  ["type", "Typography"],
  ["details", "Icons & spacing"],
  ["controls", "Buttons & forms"],
  ["patterns", "Product patterns"],
  ["roadmap", "What’s next"],
];
const sample: WishlistItem = {
  id: "design-example",
  name: "Arc table lamp",
  image_url: "/design/lamp.svg",
  current_price: 129.99,
  currency: "PLN",
  store: "Example store",
  notes: "A softer light for the reading corner.",
  tags: [{ id: "home", name: "Home", color: "#466BEA" }],
  is_purchased: false,
  price_history: [],
  created_at: "2026-09-11",
  updated_at: "2026-09-11",
};

function Section({
  id,
  number,
  title,
  note,
  children,
}: {
  id: string;
  number: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t py-10 sm:py-14">
      <div className="mb-7 flex gap-4">
        <span className="pt-1 text-xs tabular-nums text-muted-foreground">
          {number}
        </span>
        <div>
          <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <h3 className="mb-5 text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

export function DesignLibrary() {
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(sample);
  const [missing, setMissing] = useState(false);
  const [label, setLabel] = useState("all");
  async function save() {
    if (saving) return;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSaving(false);
    setNotice("Saved in this demo. Your wishlist hasn’t changed.");
  }
  return (
    <div
      data-wantio-workspace
      className="min-h-screen bg-background text-foreground"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-10">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 font-semibold"
          >
            <img src="/icon.svg" width="28" height="28" alt="" />
            Wantio{" "}
            <span className="ml-2 border-l pl-3 text-sm font-normal text-muted-foreground">
              Internal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft />{" "}
                <span className="hidden sm:inline">Back to wishlist</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-10 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
        <aside className="min-w-0 pt-7 lg:pt-16">
          <nav
            aria-label="Design library sections"
            className="flex gap-1 overflow-x-auto lg:sticky lg:top-28 lg:flex-col"
          >
            <p className="hidden pb-4 text-xs uppercase tracking-widest text-muted-foreground lg:block">
              Design library
            </p>
            {sections.map(([id, title]) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {title}
              </a>
            ))}
          </nav>
        </aside>
        <main id="main" className="min-w-0 pb-20">
          <div className="pb-12 pt-4 sm:pt-12">
            <Badge variant="outline">A living reference</Badge>
            <h1 className="mt-5 text-4xl font-medium tracking-tight sm:text-6xl">
              The shape of Wantio.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              One place for our identity and the pieces that make the product.
              Explore the brand, then try the components.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>01 — Brand book</span>
              <span aria-hidden> / </span>
              <span>02 — Component library</span>
            </div>
          </div>
          <Section
            id="logo"
            number="01"
            title="Our mark"
            note="The approved Wantio logo. A rounded hexagon, a white w, and a blue-to-violet gradient."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex min-h-64 items-center justify-center gap-4 rounded-2xl border bg-white text-neutral-950">
                <img
                  src="/icon.svg"
                  width="80"
                  height="80"
                  alt="Wantio logo on white"
                />
                <span className="text-3xl font-semibold tracking-tight">
                  Wantio
                </span>
              </div>
              <div className="flex min-h-64 items-center justify-center gap-4 rounded-2xl bg-neutral-950 text-white">
                <img
                  src="/icon.svg"
                  width="80"
                  height="80"
                  alt="Wantio logo on black"
                />
                <span className="text-3xl font-semibold tracking-tight">
                  Wantio
                </span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                {[16, 24, 32, 48].map((size) => (
                  <div key={size} className="flex flex-col items-center gap-3">
                    <img src="/icon.svg" width={size} height={size} alt="" />
                    <span className="text-xs text-muted-foreground">
                      {size}px
                    </span>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline">
                <a href="/icon.svg" download="wantio-logo.svg">
                  <Download />
                  Download SVG
                </a>
              </Button>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Keep the proportions, gradient and white letter intact. Give the
              mark breathing room; never crop, stretch or recolor it. Use the
              same source for web, Chrome and the future mobile app. The
              wordmark here uses the current product font; a custom wordmark and
              formal clear-space rules are still to be defined.
            </p>
          </Section>
          <Section
            id="color"
            number="02"
            title="Color with a purpose"
            note="Brand color belongs to the mark. The signed-in workspace uses a neutral palette so saved products take the lead."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["Brand start", "#466BEA"],
                ["Brand end", "#5156F3"],
                ["Primary", "hsl(var(--primary))"],
                ["Canvas", "hsl(var(--background))"],
                ["Surface", "hsl(var(--card))"],
                ["Border", "hsl(var(--border))"],
              ].map(([title, color]) => (
                <div
                  key={title}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <div
                    className="h-24 border-b"
                    style={{ background: color }}
                  />
                  <div className="p-4">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {title.startsWith("Brand") ? color : "Adapts to theme"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Use the theme switch to inspect light and dark surfaces. Legacy
              pink styling still exists on public pages; it is not the new brand
              direction. A complete semantic color system remains to be agreed.
            </p>
          </Section>
          <Section
            id="type"
            number="03"
            title="A clear voice"
            note="Geist is the current web typeface, served locally. The Chrome extension uses the system sans-serif. Unifying these is a future brand decision."
          >
            <div className="divide-y rounded-2xl border bg-card px-5 sm:px-7">
              {[
                [
                  "Display · 48 / 48 · medium",
                  "Things worth keeping.",
                  "text-4xl sm:text-5xl font-medium tracking-tight",
                ],
                [
                  "Heading · 24 / 32 · semibold",
                  "Your next favorite thing",
                  "text-2xl font-semibold",
                ],
                [
                  "Body · 16 / 24 · regular",
                  "Save a find today. Come back when the time is right.",
                  "text-base leading-6",
                ],
                [
                  "Label · 14 / 20 · medium",
                  "Save to wishlist",
                  "text-sm font-medium",
                ],
                [
                  "Numbers · tabular",
                  "129.99 PLN",
                  "text-2xl font-semibold tabular-nums",
                ],
              ].map(([caption, copy, cls]) => (
                <div key={caption} className="py-6">
                  <p className="mb-4 text-xs text-muted-foreground">
                    {caption}
                  </p>
                  <p className={cls}>{copy}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Use regular for reading, medium for controls, semibold for
              emphasis. Keep long text comfortably narrow. This page’s display
              scale is a proposal; the smaller examples reflect the current
              product.
            </p>
          </Section>
          <Section
            id="details"
            number="04"
            title="The small things"
            note="Lucide provides interface icons. Consistent strokes, generous hit areas and quiet borders keep the interface coherent."
          >
            <Panel title="One icon family">
              {" "}
              <div className="flex flex-wrap gap-6">
                {[
                  [Plus, "Add"],
                  [Search, "Search"],
                  [Heart, "Wishlist"],
                  [Tag, "Label"],
                  [ShoppingBag, "Purchased"],
                  [Settings, "Settings"],
                  [X, "Close"],
                ].map(([Icon, title]) => {
                  const Glyph = Icon as typeof Plus;
                  return (
                    <div
                      key={String(title)}
                      className="flex w-16 flex-col items-center gap-3"
                    >
                      <Glyph size={20} strokeWidth={2} />
                      <span className="text-xs text-muted-foreground">
                        {String(title)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                16–24px glyphs, 2px strokes, at least 44px for an interactive
                target. The brand mark is not an add button.
              </p>
            </Panel>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Panel title="Space">
                <div className="space-y-3">
                  {[4, 8, 12, 16, 24, 32].map((n) => (
                    <div className="flex items-center gap-4" key={n}>
                      <span className="w-7 text-xs tabular-nums">{n}</span>
                      <div
                        className="h-3 rounded-sm bg-foreground/70"
                        style={{ width: n * 4 }}
                      />
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Surfaces">
                <div className="flex gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-md border text-xs">
                    Control
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border text-xs">
                    Card
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Current controls use a 10px radius; product cards use 16px.
                  Borders separate content. Use shadow only where a layer needs
                  depth. Favor a consistent 4px spacing rhythm.
                </p>
              </Panel>
            </div>
          </Section>
          <Section
            id="controls"
            number="05"
            title="Try the components"
            note="These are the same components imported by the product. Hover, press or Tab through them. All example actions stay on this page."
          >
            <div className="space-y-4">
              <Panel title="Buttons · hierarchy and states">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={save} disabled={saving}>
                    {saving && <Loader2 className="animate-spin" />}
                    {saving ? "Saving…" : "Save to wishlist"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNotice("Secondary action preview.")}
                  >
                    Edit details
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setNotice("Secondary button preview.")}
                  >
                    Secondary
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setNotice("Ghost button preview.")}
                  >
                    Cancel
                  </Button>
                  <Button disabled>Unavailable</Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      setNotice(
                        "Destructive style preview. Nothing was deleted.",
                      )
                    }
                  >
                    Delete example
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Add example"
                    onClick={() => setNotice("Icon button preview.")}
                  >
                    <Plus />
                  </Button>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNotice("Small button preview.")}
                  >
                    Small
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setNotice("Large button preview.")}
                  >
                    Large
                  </Button>
                  <Button asChild variant="link">
                    <a href="#logo">
                      View logo <ArrowUpRight />
                    </a>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Default · hover · keyboard focus · pressed · disabled ·
                  loading. The existing button has no distinct pressed treatment
                  yet; track that as a polish opportunity.
                </p>
              </Panel>
              <Panel title="Fields · input, validation and selection">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError(!name.trim());
                    if (name.trim())
                      setNotice("Example validated. No product was created.");
                  }}
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="demo-name">Product name</Label>
                    <Input
                      id="demo-name"
                      placeholder="A new find"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(false);
                      }}
                      aria-invalid={error}
                      aria-describedby={error ? "demo-error" : undefined}
                      className={error ? "border-destructive" : undefined}
                    />
                    {error && (
                      <p
                        id="demo-error"
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        Enter a name to continue.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-currency">Currency</Label>
                    <Select defaultValue="PLN">
                      <SelectTrigger id="demo-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLN">PLN</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-note">Note</Label>
                    <Textarea
                      id="demo-note"
                      placeholder="What caught your eye?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-disabled">Unavailable field</Label>
                    <Input
                      id="demo-disabled"
                      disabled
                      value="Read-only example"
                      readOnly
                    />
                    <div className="flex min-h-11 items-center gap-3">
                      <Switch id="demo-switch" />
                      <Label htmlFor="demo-switch">
                        Example notification preference
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="justify-self-start"
                  >
                    Validate example
                  </Button>
                </form>
              </Panel>
            </div>
          </Section>
          <Section
            id="patterns"
            number="06"
            title="Pieces in context"
            note="Live product cards and item details, using example data. Their redesign is planned separately in SAV-9 and SAV-10."
          >
            <Tabs defaultValue="wishlist">
              <TabsList aria-label="Example product navigation">
                <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                <TabsTrigger value="purchased">Purchased</TabsTrigger>
              </TabsList>
              <TabsContent value="wishlist">
                <div className="my-5">
                  <TagFilters
                    tags={[
                      { id: "home", name: "Home", color: "#466BEA" },
                      { id: "books", name: "Books", color: "#466BEA" },
                    ]}
                    value={label === "all" ? "" : label}
                    onChange={(id) => setLabel(id || "all")}
                  />
                </div>
                <p className="mb-5 text-xs text-muted-foreground">
                  The same visible tag filters used in the wishlist. All resets
                  the selection.
                </p>
                {label === "books" ? (
                  <div className="rounded-2xl border p-8">
                    <p>No books in this example.</p>
                    <Button variant="link" onClick={() => setLabel("all")}>
                      Show all items
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-[minmax(0,300px)_1fr]">
                    <ProductCard
                      item={
                        missing
                          ? {
                              ...item,
                              image_url: undefined,
                              current_price: undefined,
                            }
                          : item
                      }
                      onTap={() => setOpen(true)}
                    />
                    <div className="space-y-5 py-3">
                      <Badge variant="secondary">Home</Badge>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Open the card to try the current item dialog. Purchase,
                        edit and delete actions only change this demo’s state.
                      </p>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="demo-missing"
                          checked={missing}
                          onCheckedChange={setMissing}
                        />
                        <Label htmlFor="demo-missing">
                          Preview missing image & price
                        </Label>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setItem(sample);
                          setMissing(false);
                          setNotice("Example reset.");
                        }}
                      >
                        Reset example
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="purchased">
                <div className="rounded-2xl border p-8">
                  <ShoppingBag className="mb-4" />
                  <h3 className="font-medium">
                    A place for things you’ve bought.
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This empty-state example is separate from your actual
                    purchases.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            <BottomSheet open={open} onClose={() => setOpen(false)}>
              <ItemDetailSheet
                item={item}
                pending={false}
                onEdit={() => {
                  setOpen(false);
                  setName(item.name);
                  document.getElementById("demo-name")?.focus();
                }}
                onMarkPurchased={(_, price) => {
                  setItem({
                    ...item,
                    is_purchased: true,
                    purchased_price: price,
                  });
                  setNotice("Marked as purchased in the example.");
                }}
                onRestore={() => {
                  setItem({ ...item, is_purchased: false });
                  setNotice("Restored in the example.");
                }}
                onDelete={() => {
                  setOpen(false);
                  setNotice(
                    "Delete action preview. Your products are untouched.",
                  );
                }}
              />
            </BottomSheet>
          </Section>
          <Section
            id="roadmap"
            number="07"
            title="Decided. In use. Still open."
            note="A reference should distinguish the product we have from the direction we’re exploring."
          >
            <div className="divide-y rounded-2xl border bg-card px-5">
              {[
                ["Approved", "New logo and original SVG", "SAV-12"],
                [
                  "In use",
                  "Neutral workspace, Geist, Lucide and shared controls",
                  "Current product",
                ],
                ["In use", "Navigation and visible label filters", "SAV-11"],
                [
                  "To refine",
                  "Desktop side panel and mobile full-screen item",
                  "SAV-10",
                ],
                ["To refine", "Product card composition", "SAV-9"],
                [
                  "To define",
                  "Complete palette, type scale, wordmark and mobile rules",
                  "Brand direction",
                ],
              ].map(([state, title, issue]) => (
                <div
                  key={title}
                  className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">{state}</p>
                    <p className="mt-1 text-sm">{title}</p>
                  </div>
                  {issue.startsWith("SAV") ? (
                    <a
                      className="flex min-h-11 items-center text-sm underline underline-offset-4"
                      href={`https://linear.app/saveli-designs/issue/${issue}`}
                    >
                      {issue}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {issue}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
          <footer className="border-t pt-6 text-xs text-muted-foreground">
            Wantio · Internal design reference · Live components, example data.
          </footer>
        </main>
      </div>
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-5 right-5 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-xl border bg-card p-4 shadow-lg"
        >
          <Check size={18} className="shrink-0" />
          <p className="flex-1 text-sm">{notice}</p>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
