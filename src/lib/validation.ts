import { z } from "zod";
export const webUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const u = new URL(value);
      return (
        ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  }, "Enter a valid http or https URL.");
const optionalUrl = z.union([webUrl, z.literal("")]).optional();
export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Choose a currency.")
  .refine((code) => {
    return Intl.supportedValuesOf("currency").includes(code);
  }, "Choose a supported currency.");
export const itemSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Enter a product name.").max(200),
  url: optionalUrl,
  image_url: optionalUrl,
  current_price: z.number().finite().min(0).max(9999999999.99).optional(),
  store: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(3000).optional(),
  currency: currencySchema.default("USD"),
  tagIds: z.array(z.uuid()).max(30).default([]),
});
export type ItemInput = z.input<typeof itemSchema>;
export const tagSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError)
    return error.issues[0]?.message || "Check the form.";
  return error instanceof Error
    ? error.message
    : "Could not save changes. Try again.";
}
