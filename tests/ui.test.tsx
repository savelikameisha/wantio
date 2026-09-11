import { afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { WishlistDashboard } from "@/components/wishlist-dashboard";
import { AddItemModal } from "@/components/add-item-modal";
import { SettingsView } from "@/components/settings-view";
import { createTag, deleteTag, addItem } from "@/lib/actions";
import type { WishlistItem } from "@/types";
vi.mock("@/lib/actions", () => ({
  addItem: vi.fn(),
  updateItem: vi.fn(),
  markPurchased: vi.fn(),
  restoreItem: vi.fn(),
  deleteItem: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const item: WishlistItem = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "First item",
  is_purchased: false,
  tags: [],
  price_history: [],
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  currency: "EUR",
  current_price: 99,
};
it("shows new server data without reloading and updates edited cards", () => {
  const view = render(
    <WishlistDashboard initialItems={[]} initialTags={[]} profile={null} />,
  );
  view.rerender(
    <WishlistDashboard initialItems={[item]} initialTags={[]} profile={null} />,
  );
  expect(screen.getByText("First item")).toBeTruthy();
  view.rerender(
    <WishlistDashboard
      initialItems={[{ ...item, name: "Updated item" }]}
      initialTags={[]}
      profile={null}
    />,
  );
  expect(screen.queryByText("First item")).toBeNull();
  expect(screen.getByText("Updated item")).toBeTruthy();
});
it("keeps form data and displays a failed save", async () => {
  vi.mocked(addItem).mockRejectedValue(new Error("Database unavailable"));
  const close = vi.fn();
  render(
    <AddItemModal
      open
      onClose={close}
      availableTags={[]}
      defaultCurrency="PLN"
    />,
  );
  fireEvent.change(screen.getByLabelText("Product name"), {
    target: { value: "My chair" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add item" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Database unavailable",
    ),
  );
  expect(
    (screen.getByLabelText("Product name") as HTMLInputElement).value,
  ).toBe("My chair");
  expect(close).not.toHaveBeenCalled();
});
it("uses the real ID from server props when deleting a newly created tag", async () => {
  const tag = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Furniture",
    color: "#6366f1",
  };
  vi.mocked(createTag).mockResolvedValue(tag);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const view = render(<SettingsView tags={[]} profile={null} items={[]} />);
  fireEvent.change(screen.getByLabelText("New tag"), {
    target: { value: "Furniture" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  await waitFor(() =>
    expect(createTag).toHaveBeenCalledWith("Furniture", "#6366f1"),
  );
  view.rerender(<SettingsView tags={[tag]} profile={null} items={[]} />);
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Delete tag Furniture",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete tag Furniture" }));
  await waitFor(() => expect(deleteTag).toHaveBeenCalledWith(tag.id));
});
it("exposes card details and navigation through named buttons", () => {
  render(
    <WishlistDashboard initialItems={[item]} initialTags={[]} profile={null} />,
  );
  expect(screen.getByRole("button", { name: "View First item" })).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Choose list" })).toBeTruthy();
});
