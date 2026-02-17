-- Add currency column to wishlist_items for per-item currency support
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
