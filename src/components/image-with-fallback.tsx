"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          fallbackClassName
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="h-8 w-8 opacity-40" />
          <span className="text-xs opacity-60">No image</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={cn("animate-pulse bg-muted", fallbackClassName)} />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, isLoading && "hidden")}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}
