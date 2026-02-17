"use client";

import { useState } from "react";
import {
  Globe,
  Tags,
  Copy,
  Check,
  LogOut,
  X,
  Plus,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, Profile } from "@/types";
import { updateProfile, createTag, deleteTag } from "@/lib/actions";

interface SettingsViewProps {
  tags: Tag[];
  profile: Profile | null;
}

const PRESET_COLORS = [
  "#6366f1", "#ef4444", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b",
  "#14b8a6", "#f97316",
];

export function SettingsView({ tags, profile }: SettingsViewProps) {
  const [shareEnabled, setShareEnabled] = useState(
    profile?.public_share_enabled ?? false
  );
  const [copied, setCopied] = useState(false);
  const [localTags, setLocalTags] = useState<Tag[]>(tags);
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [tagLoading, setTagLoading] = useState(false);

  const shareLink = profile?.public_share_id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${profile.public_share_id}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToggle = async (value: boolean) => {
    setShareEnabled(value);
    try {
      await updateProfile({ public_share_enabled: value });
    } catch {
      setShareEnabled(!value);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || tagLoading) return;
    setTagLoading(true);
    const optimisticTag: Tag = {
      id: crypto.randomUUID(),
      name: newTagName.trim(),
      color: newTagColor,
    };
    setLocalTags((prev) => [...prev, optimisticTag]);
    setNewTagName("");
    setShowTagForm(false);

    try {
      await createTag(optimisticTag.name, optimisticTag.color);
    } catch {
      setLocalTags((prev) => prev.filter((t) => t.id !== optimisticTag.id));
    } finally {
      setTagLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const deleted = localTags.find((t) => t.id === tagId);
    setLocalTags((prev) => prev.filter((t) => t.id !== tagId));

    try {
      await deleteTag(tagId);
    } catch {
      if (deleted) setLocalTags((prev) => [...prev, deleted]);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Public Share Link */}
      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Public Share Link</Label>
          </div>
          <Switch checked={shareEnabled} onCheckedChange={handleShareToggle} />
        </div>
        {shareEnabled && shareLink && (
          <div className="flex gap-2">
            <Input
              value={shareLink}
              readOnly
              className="text-xs bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Share a read-only view of your active wishlist items.
        </p>
      </Card>

      {/* Tag Management */}
      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Tags</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowTagForm(!showTagForm)}
          >
            {showTagForm ? (
              <><X className="h-3 w-3 mr-1" /> Cancel</>
            ) : (
              <><Plus className="h-3 w-3 mr-1" /> Add Tag</>
            )}
          </Button>
        </div>

        {/* Tag creation form */}
        {showTagForm && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value.slice(0, 20))}
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Color:</span>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className="h-6 w-6 rounded-full transition-all flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    {newTagColor === color && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || tagLoading}
            >
              Create Tag
            </Button>
          </div>
        )}

        {/* Existing tags */}
        <div className="flex flex-wrap gap-1.5">
          {localTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags yet.</p>
          ) : (
            localTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs cursor-default group/tag pr-1"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }}
              >
                {tag.name}
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </Card>

      {/* Appearance */}
      <AppearanceCard />

      {/* Sign Out */}
      <Card className="p-4 border-border/50">
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <Card className="p-4 border-border/50 space-y-3">
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Appearance</Label>
      </div>
      <div className="flex gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors border ${
              mounted && theme === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
