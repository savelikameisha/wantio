"use client";

import { useState } from "react";
import { Link2, PenLine } from "lucide-react";
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
import { Tag } from "@/types";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  availableTags: Tag[];
}

type Mode = "url" | "manual";

export function AddItemModal({ open, onClose, availableTags }: AddItemModalProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [store, setStore] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setUrl("");
    setName("");
    setPrice("");
    setImageUrl("");
    setStore("");
    setNotes("");
    setSelectedTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Wishlist</DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "url" ? (
            <div className="space-y-2">
              <Label htmlFor="url">Product URL</Label>
              <Input
                id="url"
                placeholder="https://store.com/product..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll try to extract product details automatically.
              </p>
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
            </>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
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
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
