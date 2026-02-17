import { Heart } from "lucide-react";

// This will be connected to Supabase later.
// For now, show a demo shared view with placeholder content.

export default function SharedWishlistPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">
            Shared Wishlist
          </h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Shared Wishlist</p>
          <p className="text-xs mt-1">
            This page will display the shared wishlist once connected to
            Supabase.
          </p>
          <p className="text-xs mt-1 font-mono text-muted-foreground/50">
            Share ID: {params.id}
          </p>
        </div>
      </main>
    </div>
  );
}
