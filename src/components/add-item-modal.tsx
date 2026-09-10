"use client";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addItem, updateItem } from "@/lib/actions";
import { itemSchema, webUrl, errorMessage } from "@/lib/validation";
import { Tag, WishlistItem } from "@/types";
export function AddItemModal({
  open,
  onClose,
  availableTags,
  editItem,
  defaultCurrency = "USD",
}: {
  open: boolean;
  onClose: () => void;
  availableTags: Tag[];
  editItem?: WishlistItem | null;
  defaultCurrency?: string;
}) {
  const [id] = useState(() => editItem?.id || crypto.randomUUID());
  const [name, setName] = useState(editItem?.name || "");
  const [url, setUrl] = useState(editItem?.url || "");
  const [price, setPrice] = useState(editItem?.current_price?.toString() || "");
  const [currency, setCurrency] = useState(
    editItem?.currency || defaultCurrency,
  );
  const [image, setImage] = useState(editItem?.image_url || "");
  const [store, setStore] = useState(editItem?.store || "");
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [tags, setTags] = useState(editItem?.tags.map((t) => t.id) || []);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  const submitLock = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  function cancelLookup() {
    controller.current?.abort();
    controller.current = null;
    setLoading(false);
  }
  async function lookup() {
    const parsed = webUrl.safeParse(url);
    if (!parsed.success) {
      setError("Enter a valid product URL.");
      return;
    }
    cancelLookup();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsed.data,
          existingTags: availableTags.map((t) => t.name),
        }),
        signal: current.signal,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Could not read the page. Enter details manually.",
        );
      if (current.signal.aborted) return;
      if (data.name) setName(data.name);
      if (data.price != null) setPrice(String(data.price));
      if (data.currency && !editItem?.is_purchased) setCurrency(data.currency);
      if (data.image_url) setImage(data.image_url);
      if (data.store) setStore(data.store);
      if (data.notes) setNotes(data.notes);
      if (Array.isArray(data.suggested_tags))
        setTags(
          availableTags
            .filter((t) => data.suggested_tags.includes(t.name))
            .map((t) => t.id),
        );
      setNotice("Details filled. Check the price and currency before saving.");
    } catch (e) {
      if (!current.signal.aborted) setError(errorMessage(e));
    } finally {
      if (controller.current === current) {
        setLoading(false);
        controller.current = null;
      }
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || loading) return;
    const parsed = itemSchema.safeParse({
      id,
      name,
      url,
      image_url: image,
      current_price: price === "" ? undefined : Number(price),
      store,
      notes,
      currency,
      tagIds: tags,
    });
    if (!parsed.success) {
      setError(errorMessage(parsed.error));
      return;
    }
    submitLock.current = true;
    setSaving(true);
    setError("");
    try {
      if (editItem) await updateItem(id, parsed.data);
      else await addItem(parsed.data);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }
  const currencies = Array.from(
    new Set([currency, ...Intl.supportedValuesOf("currency")]),
  ).sort();
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !saving) {
          cancelLookup();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Edit item" : "Add to wishlist"}
          </DialogTitle>
          <DialogDescription>
            Save a link or enter the details yourself.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          className="space-y-4"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
        >
          <div className="space-y-2">
            <label htmlFor="item-url" className="text-sm font-medium">
              Product link (optional)
            </label>
            <Input
              id="item-url"
              type="url"
              placeholder="https://store.com/product"
              value={url}
              disabled={saving}
              onChange={(e) => {
                cancelLookup();
                setUrl(e.target.value);
                setNotice("");
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!url || loading || saving}
              onClick={lookup}
            >
              {loading ? "Reading product page…" : "Fill from link"}
            </Button>
          </div>
          {error && (
            <p
              role="alert"
              className="text-sm text-destructive rounded-lg border border-destructive p-3"
            >
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          )}
          <fieldset disabled={loading || saving} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="item-name" className="text-sm font-medium">
                Product name
              </label>
              <Input
                id="item-name"
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="item-price" className="text-sm font-medium">
                  Price
                </label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="item-currency" className="text-sm font-medium">
                  Currency
                </label>
                <select
                  disabled={editItem?.is_purchased}
                  id="item-currency"
                  className="w-full h-11 border rounded-md bg-background px-3"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="item-store" className="text-sm font-medium">
                Store
              </label>
              <Input
                id="item-store"
                value={store}
                maxLength={100}
                onChange={(e) => setStore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="item-image" className="text-sm font-medium">
                Image link (optional)
              </label>
              <Input
                id="item-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
            {!!availableTags.length && (
              <fieldset>
                <legend className="text-sm font-medium mb-2">Tags</legend>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 border rounded-lg px-3 min-h-11 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tags.includes(t.id)}
                        onChange={() =>
                          setTags((old) =>
                            old.includes(t.id)
                              ? old.filter((id) => id !== t.id)
                              : [...old, t.id],
                          )
                        }
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="space-y-2">
              <label htmlFor="item-notes" className="text-sm font-medium">
                Private notes
              </label>
              <Textarea
                id="item-notes"
                maxLength={3000}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                cancelLookup();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Saving…" : editItem ? "Save changes" : "Add item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
