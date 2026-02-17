"use client";

import { PricePoint } from "@/types";

interface SparklineProps {
  data: PricePoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 30,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices
    .map((price, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((price - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const trend = prices[prices.length - 1] - prices[0];
  const strokeColor =
    trend < 0
      ? "hsl(142, 76%, 36%)" // green - price went down (good)
      : trend > 0
        ? "hsl(0, 84%, 60%)" // red - price went up
        : "hsl(var(--muted-foreground))";

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
