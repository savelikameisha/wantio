"use client";

import { ShoppingBag, Tags, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">W</span>
          </div>
          <span className="text-base font-semibold tracking-tight">Wantry</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-32">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Your wishlist,
            <br />
            <span className="text-muted-foreground">beautifully organized.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Save products from any store, track prices, and organize everything
            with tags. Simple, fast, and private.
          </p>
          <div className="flex justify-center pt-2">
            <a href="/login">
              <Button size="lg" className="text-base px-8 h-12 rounded-full">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-24 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border/50 p-6 space-y-3 bg-card">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Paste & Save</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste any product URL and we&apos;ll extract the name, price, image,
              and store automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 p-6 space-y-3 bg-card">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Organize with Tags</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create custom tags with colors to categorize your wishlist items
              any way you like.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 p-6 space-y-3 bg-card">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Share Your List</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate a shareable link for friends and family to see what
              you&apos;re wishing for.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Built with care. Your data stays private.
        </p>
      </footer>
    </div>
  );
}
