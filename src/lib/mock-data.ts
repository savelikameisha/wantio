import { WishlistItem, Tag } from "@/types";

export const mockTags: Tag[] = [
  { id: "1", name: "Tech", color: "#6366f1" },
  { id: "2", name: "Home", color: "#ec4899" },
  { id: "3", name: "Fashion", color: "#f59e0b" },
  { id: "4", name: "Books", color: "#10b981" },
  { id: "5", name: "Gaming", color: "#ef4444" },
  { id: "6", name: "Kitchen", color: "#8b5cf6" },
];

function generatePriceHistory(
  basePrice: number,
  points: number = 8,
): { price: number; recorded_at: string }[] {
  const history = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const variance = (Math.random() - 0.5) * basePrice * 0.3;
    history.push({
      price: Math.round((basePrice + variance) * 100) / 100,
      recorded_at: new Date(now - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return history;
}

export const mockItems: WishlistItem[] = [
  {
    id: "1",
    name: "Sony WH-1000XM5 Headphones",
    url: "https://example.com/sony-xm5",
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    current_price: 328.0,
    original_price: 399.99,
    store: "Amazon",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[0]],
    price_history: generatePriceHistory(350),
    notes: "Wait for Black Friday deal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Ceramic Pour Over Coffee Set",
    url: "https://example.com/coffee-set",
    image_url:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
    current_price: 45.0,
    original_price: 45.0,
    store: "Etsy",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[5], mockTags[1]],
    price_history: generatePriceHistory(45),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Mechanical Keyboard - Keychron Q1",
    url: "https://example.com/keychron",
    image_url:
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop",
    current_price: 179.0,
    original_price: 199.0,
    store: "Keychron",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[0], mockTags[4]],
    price_history: generatePriceHistory(189),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Wool Throw Blanket",
    url: "https://example.com/blanket",
    image_url:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    current_price: 89.99,
    original_price: 89.99,
    store: "West Elm",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[1]],
    price_history: generatePriceHistory(90),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: 'Kindle Paperwhite 6.8"',
    url: "https://example.com/kindle",
    image_url:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
    current_price: 139.99,
    original_price: 149.99,
    store: "Amazon",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[0], mockTags[3]],
    price_history: generatePriceHistory(145),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Minimalist Leather Wallet",
    url: "https://example.com/wallet",
    image_url:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    current_price: 65.0,
    original_price: 75.0,
    store: "Bellroy",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[2]],
    price_history: generatePriceHistory(70),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Cast Iron Dutch Oven",
    url: "https://example.com/dutch-oven",
    image_url:
      "https://images.unsplash.com/photo-1585837146751-a44118595680?w=400&h=400&fit=crop",
    current_price: 299.95,
    original_price: 369.0,
    store: "Le Creuset",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[5], mockTags[1]],
    price_history: generatePriceHistory(330),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Running Shoes - Nike Pegasus 41",
    url: "https://example.com/pegasus",
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    current_price: 140.0,
    original_price: 140.0,
    store: "Nike",
    currency: "USD",
    is_purchased: false,
    tags: [mockTags[2]],
    price_history: generatePriceHistory(140),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Purchased items
  {
    id: "p1",
    name: "AirPods Pro 2",
    url: "https://example.com/airpods",
    image_url:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop",
    current_price: 249.0,
    original_price: 249.0,
    store: "Apple",
    currency: "USD",
    is_purchased: true,
    purchased_at: "2024-12-15T10:00:00Z",
    purchased_price: 189.99,
    tags: [mockTags[0]],
    price_history: generatePriceHistory(240),
    created_at: "2024-11-01T10:00:00Z",
    updated_at: "2024-12-15T10:00:00Z",
  },
  {
    id: "p2",
    name: "Desk Lamp - BenQ ScreenBar",
    url: "https://example.com/screenbar",
    image_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    current_price: 109.0,
    original_price: 119.0,
    store: "Amazon",
    currency: "USD",
    is_purchased: true,
    purchased_at: "2025-01-05T10:00:00Z",
    purchased_price: 99.0,
    tags: [mockTags[0], mockTags[1]],
    price_history: generatePriceHistory(110),
    created_at: "2024-10-20T10:00:00Z",
    updated_at: "2025-01-05T10:00:00Z",
  },
  {
    id: "p3",
    name: "Linen Bedsheet Set",
    url: "https://example.com/bedsheets",
    image_url:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop",
    current_price: 199.0,
    original_price: 249.0,
    store: "Brooklinen",
    currency: "USD",
    is_purchased: true,
    purchased_at: "2025-01-20T10:00:00Z",
    purchased_price: 179.0,
    tags: [mockTags[1]],
    price_history: generatePriceHistory(220),
    created_at: "2024-12-01T10:00:00Z",
    updated_at: "2025-01-20T10:00:00Z",
  },
];
