import { describe, it, expect } from "vitest";
import { parsePrice, groupPurchases } from "@/lib/price";
import { itemSchema } from "@/lib/validation";
describe("price parsing", () => {
  it.each([
    ["1.299,99 €", 1299.99],
    ["$1,299.99", 1299.99],
    ["1 299,99 zł", 1299.99],
    ["1'299.99", 1299.99],
    ["99,9", 99.9],
    ["0.00", 0],
    [0, 0],
    ["1,299", 1299],
    ["Sale $99.00 was $150.00", 99],
    ["-20", null],
    ["unavailable", null],
    [Infinity, null],
  ])("parses %s", (input, expected) =>
    expect(parsePrice(input)).toBe(expected),
  );
  it("does not add different currencies together", () =>
    expect(
      groupPurchases([
        { currency: "EUR", purchased_price: 100 },
        { currency: "PLN", purchased_price: 100 },
      ]),
    ).toEqual({
      EUR: { spent: 100, saved: 0 },
      PLN: { spent: 100, saved: 0 },
    }));
  it("rejects unsafe links and invalid prices", () => {
    expect(
      itemSchema.safeParse({ name: "Phone", url: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({ name: "Phone", current_price: -1 }).success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({ name: "Phone", currency: "BAD" }).success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({
        name: "Free item",
        current_price: 0,
        currency: "PLN",
      }).success,
    ).toBe(true);
  });
});
