import { describe, expect, it } from "vitest";
import type { Product } from "@shared/commerce/types";
import { filterAndSortProducts, isCustomerFacingMappedProduct, paragraphsFrom, STOREFRONT_CATALOG_FETCH_LIMIT } from "./catalog";

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
    const renamedMappedKit = { ...products[1], tags: ["Football", "Mapped Media"], handle: "juventus-2025-26-home-jersey" };
    const namedBaseline = { ...products[1], handle: "mbeumo-19-black-kit" };
    expect(isCustomerFacingMappedProduct(genericDrop)).toBe(true);
    expect(isCustomerFacingMappedProduct(renamedMappedKit)).toBe(true);
    expect(isCustomerFacingMappedProduct(namedBaseline)).toBe(true);
    expect(isCustomerFacingMappedProduct(products[0])).toBe(false);
  });

  it("asks for more than one Shopify page, so the catalogue is not truncated at 250", () => {
    expect(STOREFRONT_CATALOG_FETCH_LIMIT).toBeGreaterThan(250);
  });
});

describe("paragraphsFrom", () => {
  it("splits Shopify's descriptionHtml back into paragraphs", () => {
    expect(paragraphsFrom("<p>The fan version.</p><p>Available Small through 4XL.</p>"))
      .toEqual(["The fan version.", "Available Small through 4XL."]);
  });

  // The bug this guards: the plain-text `description` field has the tags
  // removed with nothing put back, so four paragraphs render as one run-on
  // sentence ("...off the pitch.Available Small...").
  it("does not run paragraphs together", () => {
    const [first] = paragraphsFrom("<p>off the pitch.</p><p>Available Small.</p>");
    expect(first).toBe("off the pitch.");
  });

  it("treats markup as text, never as markup", () => {
    expect(paragraphsFrom("<p>Kit &amp; shorts <script>alert(1)</script></p>"))
      .toEqual(["Kit & shorts alert(1)"]);
  });

  it("falls back to the plain description when there is no html", () => {
    expect(paragraphsFrom("", "A carefully sourced piece.")).toEqual(["A carefully sourced piece."]);
    expect(paragraphsFrom(null, "")).toEqual([]);
  });

  it("handles line breaks and list items", () => {
    expect(paragraphsFrom("<ul><li>One</li><li>Two</li></ul>")).toEqual(["One", "Two"]);
    expect(paragraphsFrom("<p>One<br />Two</p>")).toEqual(["One", "Two"]);
  });
});
