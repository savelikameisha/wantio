"use client";
import { useState, useTransition, useEffect, useOptimistic } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Profile, WishlistItem } from "@/types";
import {
  updateProfile,
  createTag,
  deleteTag,
  restoreItem,
} from "@/lib/actions";
import { errorMessage } from "@/lib/validation";
export function SettingsView({
  tags,
  profile,
  items,
}: {
  tags: Tag[];
  profile: Profile | null;
  items: WishlistItem[];
}) {
  const [optimisticProfile, setOptimisticProfile] = useOptimistic(profile, (current, patch: Partial<Profile>) => current ? {...current,...patch} : current);
  function saveProfile(patch: {currency?:string;public_share_enabled?:boolean}) {
    run(async()=>{setOptimisticProfile(patch);await updateProfile(patch);});
  }
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shareLink =
    mounted && profile
      ? `${window.location.origin}/shared/${profile.public_share_id}`
      : "";
  function run(action: () => Promise<void>) {
    if (pending) return;
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setNotice("Link copied.");
    } catch {
      setError("Could not copy the link. Select and copy it below.");
    }
  }
  function exportItems() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exported_at: new Date().toISOString(), items, tags },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wantio-wishlist.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-semibold">Settings</h1>
      {error && (
        <p
          role="alert"
          className="text-sm text-destructive border border-destructive rounded-lg p-3"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <div className="p-4 border rounded-xl bg-card space-y-3">
        <h2 className="font-medium">Share your wishlist</h2>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={optimisticProfile?.public_share_enabled ?? false}
            disabled={pending}
            onChange={(e) =>
              saveProfile({public_share_enabled:e.target.checked})
            }
          />
          Allow viewing with a link
        </label>
        <p className="text-sm text-muted-foreground">
          Only active items are shared. Your notes stay private.
        </p>
        {profile?.public_share_enabled && (
          <>
            <Input
              aria-label="Wishlist share link"
              readOnly
              value={shareLink}
            />
            <Button variant="outline" onClick={copy}>
              Copy link
            </Button>
          </>
        )}
      </div>
      <div className="p-4 border rounded-xl bg-card space-y-3">
        <h2 className="font-medium">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 pl-3 rounded-lg border"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-sm">{t.name}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete tag ${t.name}`}
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete the tag “${t.name}”? Your items will stay.`,
                    )
                  )
                    run(() => deleteTag(t.id));
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await createTag(name, color);
              setName("");
            });
          }}
          className="space-y-2"
        >
          <label htmlFor="tag-name" className="text-sm">
            New tag
          </label>
          <div className="flex gap-2">
            <Input
              id="tag-name"
              maxLength={40}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
            <input
              type="color"
              aria-label="Tag color"
              className="h-11 w-14 shrink-0"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <Button disabled={pending || !name.trim()}>Add</Button>
          </div>
        </form>
      </div>
      <div className="p-4 border rounded-xl bg-card space-y-3">
        <label htmlFor="default-currency" className="font-medium">
          Default currency
        </label>
        <select
          id="default-currency"
          value={optimisticProfile?.currency || "USD"}
          disabled={pending}
          onChange={(e) =>
            saveProfile({ currency: e.target.value })
          }
          className="block w-full h-11 rounded-lg border bg-background px-3"
        >
          {Intl.supportedValuesOf("currency").map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          Used for new items. Existing prices keep their currency.
        </p>
      </div>
      <div className="p-4 border rounded-xl bg-card space-y-3">
        <label htmlFor="appearance" className="font-medium">
          Appearance
        </label>
        <select
          id="appearance"
          value={mounted ? theme : "system"}
          onChange={(e) => setTheme(e.target.value)}
          className="block w-full h-11 rounded-lg border bg-background px-3"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      {items.some((i) => i.is_archived) && (
        <div className="border rounded-xl p-4 space-y-2">
          <h2 className="font-medium">Archived items</h2>
          {items
            .filter((i) => i.is_archived)
            .map((i) => (
              <div
                key={i.id}
                className="flex justify-between gap-3 items-center"
              >
                <span className="text-sm">{i.name}</span>
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => restoreItem(i.id))}
                >
                  Restore
                </Button>
              </div>
            ))}
        </div>
      )}
      <Button variant="outline" onClick={exportItems} className="w-full">
        Download my wishlist
      </Button>
      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-medium">Chrome extension</h2>
        <p className="text-sm text-muted-foreground">Save products directly from a store page.</p>
        <Button asChild variant="outline"><a href="/wantio-extension.zip" download>Download extension</a></Button>
        <details className="text-sm text-muted-foreground"><summary className="cursor-pointer min-h-11 flex items-center">How to install</summary><p>Unzip the download. Open chrome://extensions, enable Developer mode, choose Load unpacked, and select the unzipped folder. Open Wantio in the extensions menu to connect your account.</p></details>
      </div>
      <form action="/auth/signout" method="post">
        <Button variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </section>
  );
}
