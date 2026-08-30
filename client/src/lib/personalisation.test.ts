import { describe, expect, it } from "vitest";
import type { Product } from "@shared/commerce/types";
import { isPersonalisable } from "./catalog";

const product = (title: string, productType: string, tags: string[]): Product => ({
  id: title,
  handle: title.toLowerCase().replaceAll(" ", "-"),
  title,
  description: "",
  descriptionHtml: "",
  productType,
  vendor: "Stadium Supply",
  tags,
  images: [],
  priceRange: { min: { amount: "450.00", currencyCode: "ZAR" }, max: { amount: "450.00", currencyCode: "ZAR" } },
  options: [],
  variants: [],
});

describe("isPersonalisable", () => {
  it("offers printing on fan-version shirts", () => {
    expect(isPersonalisable(product("Liverpool 2025/26 Home Jersey", "Football Jersey", ["Fan Version"]))).toBe(true);
    expect(isPersonalisable(product("Arsenal 2025/26 Away Jersey", "Soccer Fan Version", ["Arsenal"]))).toBe(true);
  });

  it("withholds it from player and authentic shirts, which ship in official spec", () => {
    expect(isPersonalisable(product("Liverpool 2025/26 Home Jersey — Player Version", "Football Jersey", ["Player Version"]))).toBe(false);
    expect(isPersonalisable(product("Arsenal 2024/25 Home Long Sleeve Authentic Jersey", "Football Jersey", ["Authentic"]))).toBe(false);
  });

  it("withholds it from retro shirts", () => {
    expect(isPersonalisable(product("Juventus 1997/98 Home Retro Jersey", "Soccer Retro", ["Soccer Retro"]))).toBe(false);
  });

  it("withholds it from anything that is not a shirt", () => {
    const cases: Array<[string, string, string[]]> = [
      ["2025/26 Liverpool Training Set Fan Version", "Training Top & Shorts", ["Fan Version"]],
      ["Arsenal 2024/25 Training Hoodie", "Hoodie", ["Fan Version"]],
      ["2026/27 Real Madrid Home Kids Kit", "Kids Kit", ["Fan Version"]],
      ["2026 F1 Ferrari Polo", "F1 Jersey", ["Fan Version"]],
      ["Orlando Pirates 2026/27 Training Kit", "Football Jersey", ["Fan Version"]],
      ["Inter Miami CF 2025 Training Top", "Football Jersey", ["Fan Version"]],
    ];
    for (const [title, type, tags] of cases) {
      expect(isPersonalisable(product(title, type, tags)), title).toBe(false);
    }
  });
});
