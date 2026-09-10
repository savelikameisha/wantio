export function parsePrice(value: unknown): number | null {
  if (typeof value === "number")
    return Number.isFinite(value) && value >= 0
      ? Math.round(value * 100) / 100
      : null;
  if (typeof value !== "string" || /-\s*\d/.test(value)) return null;
  // Read one amount, never concatenate a sale price and the original price.
  const match = value.match(/\d[\d\s\u00a0.,'’]*/);
  if (!match) return null;
  let amount = match[0].replace(/[\s\u00a0'’]/g, "").replace(/[.,]+$/, "");
  const comma = amount.lastIndexOf(","),
    dot = amount.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimal = Math.max(comma, dot);
    amount =
      amount.slice(0, decimal).replace(/[.,]/g, "") +
      "." +
      amount.slice(decimal + 1);
  } else if (comma >= 0 || dot >= 0) {
    const pos = Math.max(comma, dot);
    const fraction = amount.length - pos - 1;
    amount =
      fraction === 1 || fraction === 2
        ? amount.slice(0, pos).replace(/[.,]/g, "") +
          "." +
          amount.slice(pos + 1)
        : amount.replace(/[.,]/g, "");
  }
  const result = Number(amount);
  return Number.isFinite(result) && result >= 0 && result <= 9999999999.99
    ? Math.round(result * 100) / 100
    : null;
}
export function formatMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
export function groupPurchases(
  items: {
    currency?: string;
    purchased_price?: number;
    current_price?: number;
    original_price?: number;
  }[],
) {
  const groups: Record<string, { spent: number; saved: number }> = {};
  for (const item of items) {
    const currency = item.currency || "USD";
    const paid = item.purchased_price ?? item.current_price;
    if (paid == null) continue;
    const group = (groups[currency] ??= { spent: 0, saved: 0 });
    group.spent += paid;
    group.saved += Math.max(0, (item.original_price ?? paid) - paid);
  }
  return groups;
}
