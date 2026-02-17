"use client";

import { useState, useCallback, useEffect } from "react";
import { Link2, PenLine, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { addItem, updateItem } from "@/lib/actions";
import { Tag, WishlistItem } from "@/types";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  availableTags: Tag[];
  editItem?: WishlistItem | null;
}

type Mode = "url" | "manual";
type ScrapeStatus = "idle" | "loading" | "success" | "error";

export function AddItemModal({
  open,
  onClose,
  availableTags,
  editItem,
}: AddItemModalProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [store, setStore] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>("idle");
  const [scrapeError, setScrapeError] = useState("");

  // Pre-fill when editing
  useEffect(() => {
    if (editItem) {
      setUrl(editItem.url || "");
      setName(editItem.name);
      setPrice(editItem.current_price?.toString() || "");
      setImageUrl(editItem.image_url || "");
      setStore(editItem.store || "");
      setNotes(editItem.notes || "");
      setCurrency(editItem.currency || "");
      setSelectedTags(editItem.tags.map((t) => t.id));
      setMode(editItem.url ? "url" : "manual");
      if (editItem.url) setScrapeStatus("success");
    }
  }, [editItem]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const scrapeUrl = useCallback(async (inputUrl: string) => {
    if (!inputUrl.match(/^https?:\/\/.+\..+/)) return;

    setScrapeStatus("loading");
    setScrapeError("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScrapeStatus("error");
        setScrapeError(data.error || "Failed to fetch product details");
        return;
      }

      if (data.name) setName(data.name);
      if (data.price) setPrice(String(data.price));
      if (data.image_url) setImageUrl(data.image_url);
      if (data.store) setStore(data.store);
      if (data.currency) setCurrency(data.currency);

      setScrapeStatus("success");
    } catch {
      setScrapeStatus("error");
      setScrapeError("Could not connect to scraping service");
    }
  }, []);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (scrapeStatus !== "idle") {
      setScrapeStatus("idle");
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.match(/^https?:\/\/.+\..+/)) {
      setTimeout(() => scrapeUrl(pasted), 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = {
        name: name || url,
        url: url || undefined,
        image_url: imageUrl || undefined,
        current_price: price ? parseFloat(price) : undefined,
        store: store || undefined,
        notes: notes || undefined,
        currency: currency || undefined,
        tagIds: selectedTags,
      };

      if (editItem) {
        await updateItem(editItem.id, formData);
      } else {
        await addItem(formData);
      }

      onClose();
      resetForm();
    } catch {
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUrl("");
    setName("");
    setPrice("");
    setImageUrl("");
    setStore("");
    setNotes("");
    setCurrency("");
    setSelectedTags([]);
    setScrapeStatus("idle");
    setScrapeError("");
  };

  const isEditing = !!editItem;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
          if (!editItem) resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Add to Wishlist"}</DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        {!isEditing && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMode("url")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                mode === "url"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link2 className="h-4 w-4" />
              From URL
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                mode === "manual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PenLine className="h-4 w-4" />
              Manual
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "url" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="url">Product URL</Label>
                <div className="relative">
                  <Input
                    id="url"
                    placeholder="Paste a product URL..."
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onPaste={handleUrlPaste}
                  />
                  {scrapeStatus === "loading" && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {scrapeStatus === "success" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {scrapeStatus === "error" && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {!isEditing && scrapeStatus === "idle" && (
                  <p className="text-xs text-muted-foreground">
                    Paste a URL to auto-extract product details.
                  </p>
                )}
                {scrapeStatus === "loading" && (
                  <p className="text-xs text-muted-foreground">
                    Extracting product details...
                  </p>
                )}
                {scrapeStatus === "success" && !isEditing && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Product details extracted! Review and edit below.
                  </p>
                )}
                {scrapeStatus === "error" && (
                  <p className="text-xs text-red-500">
                    {scrapeError} — fill in the details manually below.
                  </p>
                )}
              </div>

              {(scrapeStatus === "success" ||
                scrapeStatus === "error" ||
                isEditing) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="url-name">Product Name</Label>
                    <Input
                      id="url-name"
                      placeholder="Product name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="url-price">
                        Price{" "}
                        {currency && (
                          <span className="text-xs text-muted-foreground">
                            ({currency})
                          </span>
                        )}
                      </Label>
                      <Input
                        id="url-price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url-store">Store</Label>
                      <Input
                        id="url-store"
                        placeholder="Store name"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                      />
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="space-y-2">
                      <Label>Image Preview</Label>
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={imageUrl}
                            alt="Product"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                        <Input
                          placeholder="Image URL"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                  {!imageUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="url-image">Image URL</Label>
                      <Input
                        id="url-image"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {url && scrapeStatus === "idle" && !isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => scrapeUrl(url)}
                >
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Fetch Product Details
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store">Store</Label>
                  <Input
                    id="store"
                    placeholder="Store name"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-url">Product URL (optional)</Label>
                <Input
                  id="manual-url"
                  placeholder="https://store.com/product..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      selectedTags.includes(tag.id) ? "default" : "outline"
                    }
                    className="cursor-pointer transition-all text-xs"
                    style={
                      selectedTags.includes(tag.id)
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : {}
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this item..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
