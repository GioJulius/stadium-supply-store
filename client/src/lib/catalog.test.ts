import { describe, expect, it } from "vitest";
import type { Product } from "@shared/commerce/types";
import { filterAndSortProducts, isCustomerFacingMappedProduct } from "./catalog";

const product = (title: string, amount: string, tags: string[]): Product => ({
  id: title,
  handle: title.toLowerCase().replaceAll(" ", "-"),
  title,
  description: "",
  descriptionHtml: "",
  productType: "Football Jersey",
  vendor: "Stadium Supply",
  tags,
  images: [],
  priceRange: { min: { amount, currencyCode: "ZAR" }, max: { amount, currencyCode: "ZAR" } },
  options: [],
  variants: [],
});

describe("filterAndSortProducts", () => {
  const products = [
    product("Retro Kit", "700", ["Football", "Retro"]),
    product("Fan Kit", "450", ["Football", "Fan Version", "New Arrival"]),
    product("Player Kit", "650", ["Football", "Player Version"]),
  ];

  it("filters kits by the selected category tag", () => {
    expect(filterAndSortProducts(products, "fan", "featured").map(item => item.title)).toEqual(["Fan Kit"]);
  });

  it("orders product cards by price when requested", () => {
    expect(filterAndSortProducts(products, "all", "price-desc").map(item => item.title)).toEqual(["Retro Kit", "Player Kit", "Fan Kit"]);
  });

  it("only exposes reconciled generic drops and approved named records", () => {
    const genericDrop = { ...products[1], tags: ["Football", "Editable Drop"], handle: "stadium-supply-fan-jersey-drop-07" };
    const namedBaseline = { ...products[1], handle: "mbeumo-19-black-kit" };
    expect(isCustomerFacingMappedProduct(genericDrop)).toBe(true);
    expect(isCustomerFacingMappedProduct(namedBaseline)).toBe(true);
    expect(isCustomerFacingMappedProduct(products[0])).toBe(false);
  });
});
