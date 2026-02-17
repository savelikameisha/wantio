"use client";

import { useState } from "react";
import {
  Clock,
  Globe,
  Bell,
  DollarSign,
  Tags,
  Copy,
  Check,
  LogOut,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag, Profile } from "@/types";
import { updateProfile } from "@/lib/actions";
import { ThemeToggle } from "./theme-toggle";

interface SettingsViewProps {
  tags: Tag[];
  profile: Profile | null;
}

export function SettingsView({ tags, profile }: SettingsViewProps) {
  const [frequency, setFrequency] = useState(
    profile?.price_check_frequency ?? "daily"
  );
  const [shareEnabled, setShareEnabled] = useState(
    profile?.public_share_enabled ?? false
  );
  const [emailNotifs, setEmailNotifs] = useState(
    profile?.notification_email ?? true
  );
  const [pushNotifs, setPushNotifs] = useState(
    profile?.notification_push ?? false
  );
  const [currency, setCurrency] = useState(profile?.currency ?? "USD");
  const [copied, setCopied] = useState(false);

  const shareLink = profile?.public_share_id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${profile.public_share_id}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async (data: Parameters<typeof updateProfile>[0]) => {
    try {
      await updateProfile(data);
    } catch {
      // TODO: Show error toast
    }
  };

  const handleFrequency = (value: string) => {
    setFrequency(value);
    handleUpdate({ price_check_frequency: value });
  };

  const handleShareToggle = (value: boolean) => {
    setShareEnabled(value);
    handleUpdate({ public_share_enabled: value });
  };

  const handleEmailNotifs = (value: boolean) => {
    setEmailNotifs(value);
    handleUpdate({ notification_email: value });
  };

  const handlePushNotifs = (value: boolean) => {
    setPushNotifs(value);
    handleUpdate({ notification_push: value });
  };

  const handleCurrency = (value: string) => {
    setCurrency(value);
    handleUpdate({ currency: value });
  };

  const frequencies = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
  ];

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Appearance */}
      <Card className="p-4 border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Appearance</div>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      {/* Price Check Frequency */}
      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Price Check Frequency</Label>
        </div>
        <div className="flex gap-1.5">
          {frequencies.map((f) => (
            <Button
              key={f.value}
              variant={frequency === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleFrequency(f.value)}
              className="flex-1 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </Card>

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

      {/* Notifications */}
      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Notifications</Label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Email notifications
            </Label>
            <Switch checked={emailNotifs} onCheckedChange={handleEmailNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Push notifications
            </Label>
            <Switch checked={pushNotifs} onCheckedChange={handlePushNotifs} />
          </div>
        </div>
      </Card>

      {/* Currency */}
      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Currency</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currencies.map((c) => (
            <Button
              key={c}
              variant={currency === c ? "default" : "outline"}
              size="sm"
              onClick={() => handleCurrency(c)}
              className="text-xs"
            >
              {c}
            </Button>
          ))}
        </div>
      </Card>

      {/* Tag Management */}
      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Tags</Label>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            Add Tag
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs cursor-default"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                borderColor: `${tag.color}30`,
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </Card>

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
