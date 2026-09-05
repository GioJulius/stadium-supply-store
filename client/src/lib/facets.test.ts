import { describe, expect, it } from "vitest";
import type { Product, ProductVariant } from "@shared/commerce/types";
import {
  applyRail,
  clubOf,
  collectFacets,
  EMPTY_RAIL,
  kitKey,
  kitSlotOf,
  seasonOf,
  sizeRangeLabel,
  sizesInStock,
  sortSizes,
  versionOf,
} from "./facets";

const variant = (size: string, available = true): ProductVariant => ({
  id: `v-${size}`,
  title: size,
  price: { amount: "500.00", currencyCode: "ZAR" },
  compareAtPrice: null,
  availableForSale: available,
  selectedOptions: [{ name: "Size", value: size }],
});

const product = (title: string, amount = "500.00", variants: ProductVariant[] = [], tags: string[] = []): Product => ({
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
  variants,
});

describe("versionOf", () => {
  it("reads the version out of the title", () => {
    expect(versionOf(product("Liverpool 2025/26 Home Jersey (Fan Version)"))).toBe("fan");
    expect(versionOf(product("Liverpool 2025/26 Home Jersey — Player Version"))).toBe("player");
    expect(versionOf(product("Portugal 2006 Retro Jersey"))).toBe("retro");
  });

  it("returns null rather than guessing when nothing says", () => {
    expect(versionOf(product("Arsenal 2025/26 Home Jersey"))).toBeNull();
  });

  it("only matches whole words, so a club name cannot be mistaken for a version", () => {
    expect(versionOf(product("Fanatics Training Top"))).toBeNull();
  });

  it("shelves a retro as retro even when it is sold in fan spec", () => {
    expect(versionOf(product("Italy 1998 Retro Jersey (Fan Version)"))).toBe("retro");
  });
});

describe("seasonOf", () => {
  it("normalises every spelling the imports use", () => {
    expect(seasonOf(product("Bayern 25/26 Home"))).toBe("25/26");
    expect(seasonOf(product("Bayern 2025/26 Home"))).toBe("25/26");
    expect(seasonOf(product("Bayern 2025-26 Home"))).toBe("25/26");
  });

  it("returns null when the title never says", () => {
    expect(seasonOf(product("Celtic Hooped Retro Jersey"))).toBeNull();
  });
});

describe("kitSlotOf", () => {
  it("picks the slot out of the title", () => {
    expect(kitSlotOf(product("Netherlands 2025/26 Away Jersey"))).toBe("away");
    expect(kitSlotOf(product("Liverpool 2025/26 Third Jersey"))).toBe("third");
  });

  it("prefers goalkeeper over the slot word that follows it", () => {
    expect(kitSlotOf(product("England Goalkeeper Home Shirt"))).toBe("goalkeeper");
  });

  it("returns null when the title never says", () => {
    expect(kitSlotOf(product("Atletico Madrid Spider-Man 2 Jersey"))).toBeNull();
  });
});

describe("sizesInStock", () => {
  it("reports only the variants that can actually be bought", () => {
    const kit = product("Kit", "500.00", [variant("S"), variant("M", false), variant("L")]);
    expect(sizesInStock(kit)).toEqual(["S", "L"]);
  });

  it("normalises the spellings the different imports use", () => {
    const kit = product("Kit", "500.00", [variant("Small"), variant("XXL"), variant("large")]);
    expect(sizesInStock(kit)).toEqual(["S", "L", "2XL"]);
  });
});

describe("sortSizes", () => {
  it("orders smallest to largest, not alphabetically", () => {
    expect(sortSizes(["3XL", "M", "XL", "S", "2XL"])).toEqual(["S", "M", "XL", "2XL", "3XL"]);
  });

  it("sorts anything it does not recognise to the end", () => {
    expect(sortSizes(["One Size", "M", "S"])).toEqual(["S", "M", "One Size"]);
  });
});

describe("sizeRangeLabel", () => {
  it("reads back the run", () => {
    expect(sizeRangeLabel(["S", "M", "L", "5XL"])).toBe("S–5XL");
  });

  it("says the single size rather than a range", () => {
    expect(sizeRangeLabel(["L"])).toBe("L");
  });

  it("is empty when nothing is left, so the caller can say sold out", () => {
    expect(sizeRangeLabel([])).toBe("");
  });
});

describe("kitKey", () => {
  it("groups the same kit across versions and sleeve lengths", () => {
    const a = kitKey(product("Liverpool 2025/26 Third Jersey"));
    const b = kitKey(product("Liverpool 2025/26 Third Long Sleeve Shirt (Player Version)"));
    expect(a).toBe(b);
  });

  it("keeps different kits apart", () => {
    expect(kitKey(product("Liverpool 2025/26 Home Jersey")))
      .not.toBe(kitKey(product("Liverpool 2025/26 Away Jersey")));
  });
});

describe("collectFacets", () => {
  it("offers only what the given products actually have", () => {
    const facets = collectFacets([
      product("Liverpool 25/26 Home Jersey (Fan Version)", "500.00", [variant("S"), variant("M")]),
      product("Portugal 2006 Retro Jersey", "700.00", [variant("L")]),
    ]);
    expect(facets.versions).toEqual(["fan", "retro"]);
    expect(facets.sizes).toEqual(["S", "M", "L"]);
    expect(facets.seasons).toEqual(["25/26"]);
    expect(facets.slots).toEqual(["home"]);
    expect(facets.priceMin).toBe(500);
    expect(facets.priceMax).toBe(700);
  });
});

describe("applyRail", () => {
  const catalogue = [
    product("Liverpool 25/26 Home Jersey (Fan Version)", "500.00", [variant("S"), variant("M")]),
    product("Liverpool 25/26 Home Jersey (Player Version)", "650.00", [variant("L")]),
    product("Celtic Hooped Retro Jersey", "700.00", [variant("M")]),
  ];

  it("returns everything when nothing is selected", () => {
    expect(applyRail(catalogue, EMPTY_RAIL)).toHaveLength(3);
  });

  it("narrows by version", () => {
    expect(applyRail(catalogue, { ...EMPTY_RAIL, version: "player" }).map(p => p.title))
      .toEqual(["Liverpool 25/26 Home Jersey (Player Version)"]);
  });

  it("treats several sizes as any-of, not all-of", () => {
    expect(applyRail(catalogue, { ...EMPTY_RAIL, sizes: ["S", "L"] })).toHaveLength(2);
  });

  it("caps by price", () => {
    expect(applyRail(catalogue, { ...EMPTY_RAIL, maxPrice: 500 })).toHaveLength(1);
  });

  it("finds the listings that never declared a season", () => {
    expect(applyRail(catalogue, { ...EMPTY_RAIL, season: "unspecified" }).map(p => p.title))
      .toEqual(["Celtic Hooped Retro Jersey"]);
  });

  it("finds the listings that never declared a kit slot", () => {
    expect(applyRail(catalogue, { ...EMPTY_RAIL, slot: "unspecified" }).map(p => p.title))
      .toEqual(["Celtic Hooped Retro Jersey"]);
  });

  it("composes filters rather than replacing them", () => {
    expect(applyRail(catalogue, { ...EMPTY_RAIL, version: "fan", sizes: ["L"] })).toHaveLength(0);
  });
});

describe("sortSizes, kids ages", () => {
  it("sorts age sizes numerically, not as text", () => {
    expect(sortSizes(["10-11", "2-3", "6-7", "4-5"])).toEqual(["2-3", "4-5", "6-7", "10-11"]);
  });

  it("keeps the adult run ahead of the kids run", () => {
    expect(sortSizes(["2-3", "M", "10-11", "S"])).toEqual(["S", "M", "2-3", "10-11"]);
  });
});

describe("clubOf", () => {
  it("names the club from the shop menu's own team list", () => {
    expect(clubOf(product("Liverpool 2025/26 Third Jersey"))).toBe("Liverpool");
  });

  it("prefers the longer match, so City is not answered with United", () => {
    expect(clubOf(product("Manchester City 2025/26 Home Jersey"))).toBe("Manchester City");
    expect(clubOf(product("Manchester United Away 26/27"))).toBe("Manchester United");
  });

  it("returns null rather than inventing a crumb", () => {
    expect(clubOf(product("Assorted Training Bib"))).toBeNull();
  });
});
