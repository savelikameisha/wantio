import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ImageWithFallback } from "@/components/image-with-fallback";
afterEach(cleanup);
it("supports local assets and shows a fallback when they fail", () => {
  render(<ImageWithFallback src="/design/lamp.svg" alt="Lamp" />);
  const image = screen.getByRole("img", { name: "Lamp" });
  expect(image.getAttribute("src")).toBe("/design/lamp.svg");
  fireEvent.error(image);
  expect(screen.queryByRole("img")).toBeNull();
});
it.each([
  "javascript:alert(1)",
  "//untrusted.example/image.png",
  "data:image/svg+xml,test",
])("does not render unsupported image sources: %s", (src) => {
  render(<ImageWithFallback src={src} alt="Lamp" />);
  expect(screen.queryByRole("img")).toBeNull();
});
