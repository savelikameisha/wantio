"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const valid = src && /^https?:\/\//i.test(src) && failed !== src;
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-muted/40",
        fallbackClassName,
      )}
    >
      {valid ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-contain",
            className,
          )}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImageOff className="h-8 w-8" aria-label={alt || "No image"} />
        </div>
      )}
    </div>
  );
}
