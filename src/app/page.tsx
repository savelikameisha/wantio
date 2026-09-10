import { createClient } from "@/lib/supabase/server";
import { getWishlistItems, getTags, getProfile } from "@/lib/data";
import { WishlistDashboard } from "@/components/wishlist-dashboard";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

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
