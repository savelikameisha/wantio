import { getWishlistItems, getTags, getProfile } from "@/lib/data";
import { WishlistDashboard } from "@/components/wishlist-dashboard";

export default async function Home() {
  const [items, tags, profile] = await Promise.all([
    getWishlistItems(),
    getTags(),
    getProfile(),
  ]);

  return (
    <WishlistDashboard
      initialItems={items}
      initialTags={tags}
      profile={profile}
    />
  );
}
