import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  TRY: "₺",
  KRW: "₩",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  RUB: "₽",
};

export function getCurrencySymbol(code?: string): string {
  if (!code) return "$";
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
}
