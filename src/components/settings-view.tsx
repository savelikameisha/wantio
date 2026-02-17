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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/types";
import { ThemeToggle } from "./theme-toggle";

interface SettingsViewProps {
  tags: Tag[];
}

export function SettingsView({ tags }: SettingsViewProps) {
  const [frequency, setFrequency] = useState("daily");
  const [shareEnabled, setShareEnabled] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [copied, setCopied] = useState(false);

  const shareLink = "https://wantry.app/shared/abc123-demo";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              onClick={() => setFrequency(f.value)}
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
          <Switch checked={shareEnabled} onCheckedChange={setShareEnabled} />
        </div>
        {shareEnabled && (
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
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Push notifications
            </Label>
            <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
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
              onClick={() => setCurrency(c)}
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
    </div>
  );
}
