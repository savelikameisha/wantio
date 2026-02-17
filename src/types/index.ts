export type Priority = 0 | 1 | 2 | 3;

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface PricePoint {
  price: number;
  recorded_at: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  url?: string;
  image_url?: string;
  current_price?: number;
  original_price?: number;
  store?: string;
  priority: Priority;
  is_purchased: boolean;
  purchased_at?: string;
  purchased_price?: number;
  notes?: string;
  tags: Tag[];
  price_history: PricePoint[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  currency: string;
  price_check_frequency: string;
  public_share_enabled: boolean;
  public_share_id: string;
  notification_email: boolean;
  notification_push: boolean;
  created_at: string;
  updated_at: string;
}

export type ViewMode = "wishlist" | "purchased" | "settings";
