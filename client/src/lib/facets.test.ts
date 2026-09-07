import { describe, expect, it } from "vitest";
import type { Product, ProductVariant } from "@shared/commerce/types";
import { isGroup, SHOP_MENU, type NavLeaf, type NavNode } from "./navigation";
import { TEAMS_BY_SLUG } from "./teams";
import {
  applyRail,
  collectFacets,
  countryOf,
  EMPTY_RAIL,
  kitKey,
  kitSlotOf,
  seasonOf,
  sizeRangeLabel,
  sizesInStock,
  sortSizes,
  sportOf,
  teamOf,
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

describe("teamOf", () => {
  it("names the team", () => {
    expect(teamOf(product("Liverpool 2025/26 Third Jersey"))?.label).toBe("Liverpool");
  });

  it("prefers the longer match, so City is not answered with United", () => {
    expect(teamOf(product("Manchester City 2025/26 Home Jersey"))?.label).toBe("Manchester City");
    expect(teamOf(product("Manchester United Away 26/27"))?.label).toBe("Manchester United");
  });

  it("does not let Aston Villa answer for Aston Martin", () => {
    expect(teamOf(product("2025/26 Aston Villa Away Player Version"))?.label).toBe("Aston Villa");
    expect(teamOf(product("Aston Martin Aramco 2026 Team Track Jacket"))?.label).toBe("Aston Martin");
  });

  it("returns null for stock that belongs to no team", () => {
    expect(teamOf(product("adidas Black Full-Zip Tracksuit"))).toBeNull();
  });

  // Two sides are called Chiefs and the store carries both. The football one is
  // Kaizer Chiefs, listed without its first name; the rugby one always says so.
  it("tells the two Chiefs apart", () => {
    expect(teamOf(product("Chiefs 2026/27 Home Jersey"))?.slug).toBe("kaizer-chiefs");
    expect(teamOf(product("Chiefs Home Rugby Jersey"))?.slug).toBe("chiefs-rugby");
  });
});

describe("countryOf", () => {
  it("answers for a national side", () => {
    expect(countryOf(product("Brazil 2026 Home Fan Version"))?.label).toBe("Brazil");
  });

  it("does not call a Spanish club Spain", () => {
    expect(countryOf(product("Real Madrid 2025/26 Home Jersey"))).toBeNull();
    expect(teamOf(product("Real Madrid 2025/26 Home Jersey"))?.label).toBe("Real Madrid");
  });
});

describe("sportOf", () => {
  // productType describes the GARMENT, so neither of these says which code it
  // belongs to. Only the team knows — which is why the registry exists.
  it("reads the sport off the team when the garment cannot say", () => {
    expect(sportOf(product("Scuderia Ferrari 2025 Team Hoodie"))).toBe("f1");
    expect(sportOf(product("New Zealand All Blacks Track Jacket"))).toBe("rugby");
  });

  it("falls back to the wording for a national side that plays both", () => {
    expect(sportOf(product("South Africa Springboks Kids Rugby Kit"))).toBe("rugby");
    expect(sportOf(product("South Africa 2026 Home Fan Version"))).toBe("football");
  });

  it("defaults to football, so teamless stock is not hidden from every filter", () => {
    expect(sportOf(product("adidas Black Full-Zip Tracksuit"))).toBe("football");
  });
});

describe("the nav menu and the team registry", () => {
  // Two lists of the same thing drift. The menu's team leaves carry a registry
  // slug so a link can filter by team instead of by substring; if a slug here
  // ever stops existing, the link silently filters on nothing.
  it("resolves every team slug the menu names", () => {
    const leaves = (function walk(nodes: NavNode[]): NavLeaf[] {
      return nodes.flatMap(node => (isGroup(node) ? walk(node.children) : [node]));
    })(SHOP_MENU.flatMap(section => section.children ?? []));

    const named = leaves.filter(leaf => leaf.team);
    expect(named.length).toBeGreaterThan(25);
    expect(named.filter(leaf => !TEAMS_BY_SLUG.has(leaf.team!)).map(leaf => leaf.label)).toEqual([]);
  });

  // A leaf that names a team must find the same products by either route, or
  // the menu promises a count the page does not deliver.
  it("agrees with the registry on which team a leaf's own term names", () => {
    const mismatched = (function walk(nodes: NavNode[]): NavLeaf[] {
      return nodes.flatMap(node => (isGroup(node) ? walk(node.children) : [node]));
    })(SHOP_MENU.flatMap(section => section.children ?? []))
      .filter(leaf => leaf.team)
      .filter(leaf => teamOf(product(leaf.q))?.slug !== leaf.team)
      .map(leaf => `${leaf.label} (q="${leaf.q}")`);

    expect(mismatched).toEqual([]);
  });
});

describe("applyRail — the dimensions added for the category filters", () => {
  const catalogue = [
    product("Liverpool 2025/26 Home Fan Version"),
    product("Scuderia Ferrari 2025 Team Hoodie"),
    product("New Zealand All Blacks Home Rugby Jersey"),
    product("adidas Black Full-Zip Tracksuit"),
  ];

  it("filters by sport", () => {
    const rugby = applyRail(catalogue, { ...EMPTY_RAIL, sport: "rugby" });
    expect(rugby.map(p => p.title)).toEqual(["New Zealand All Blacks Home Rugby Jersey"]);
  });

  it("filters by team slug", () => {
    const reds = applyRail(catalogue, { ...EMPTY_RAIL, team: "liverpool" });
    expect(reds.map(p => p.title)).toEqual(["Liverpool 2025/26 Home Fan Version"]);
  });

  // The plain stock that belongs to no club has to stay reachable, or a shopper
  // who touches the team filter can never get back to it.
  it("filters to the stock that has no team at all", () => {
    const plain = applyRail(catalogue, { ...EMPTY_RAIL, team: "unspecified" });
    expect(plain.map(p => p.title)).toEqual(["adidas Black Full-Zip Tracksuit"]);
  });

  it("filters by canonical product type", () => {
    const typed = [
      { ...product("Liverpool Home Fan Version"), productType: "Fan Version" },
      { ...product("Liverpool Training Hoodie"), productType: "Hoodie" },
    ];
    expect(applyRail(typed, { ...EMPTY_RAIL, type: "Hoodie" }).map(p => p.title)).toEqual([
      "Liverpool Training Hoodie",
    ]);
  });

  it("composes with the filters that were already there", () => {
    const both = applyRail(catalogue, { ...EMPTY_RAIL, sport: "football", version: "fan" });
    expect(both.map(p => p.title)).toEqual(["Liverpool 2025/26 Home Fan Version"]);
  });

  it("offers only the sports and teams present in the results", () => {
    const facets = collectFacets(catalogue);
    expect(facets.sports).toEqual(["football", "rugby", "f1"]);
    // Sorted by label, so Scuderia Ferrari comes last however its slug reads.
    expect(facets.teams.map(t => t.label)).toEqual(["Liverpool", "New Zealand", "Scuderia Ferrari"]);
  });
});
