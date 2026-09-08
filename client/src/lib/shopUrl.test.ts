import { describe, expect, it } from "vitest";
import { EMPTY_RAIL } from "./facets";
import { EMPTY_SHOP_QUERY, parseShopParams, shopHref, toShopParams, type ShopQuery } from "./shopUrl";

const parse = (search: string) => parseShopParams(new URLSearchParams(search));

describe("toShopParams", () => {
  // /shop has to stay the URL it has always been, or the canonical in the
  // prerendered HTML stops matching and a shopper who chose nothing gets a
  // paragraph of defaults in the address bar.
  it("writes nothing for an untouched shop", () => {
    expect(toShopParams(EMPTY_SHOP_QUERY).toString()).toBe("");
  });

  it("writes only what has been chosen", () => {
    const params = toShopParams({
      ...EMPTY_SHOP_QUERY,
      rail: { ...EMPTY_RAIL, team: "liverpool", sizes: ["M", "L"] },
    });
    expect(params.toString()).toBe("team=liverpool&size=M%2CL");
  });

  it("leaves the default sort and the first page out", () => {
    expect(toShopParams({ ...EMPTY_SHOP_QUERY, sort: "latest", page: 1 }).toString()).toBe("");
    expect(toShopParams({ ...EMPTY_SHOP_QUERY, sort: "price-asc", page: 3 }).toString()).toBe(
      "sort=price-asc&page=3"
    );
  });
});

describe("parseShopParams", () => {
  it("round-trips everything it can express", () => {
    const query: ShopQuery = {
      q: "arsenal",
      not: "rugby",
      label: "Arsenal",
      rail: {
        version: "retro",
        sizes: ["M", "2XL"],
        season: "25/26",
        slot: "away",
        sport: "football",
        team: "arsenal",
        type: "Fan Version",
        maxPrice: 700,
      },
      sort: "price-desc",
      page: 4,
    };
    expect(parseShopParams(toShopParams(query))).toEqual(query);
  });

  it("keeps the legacy free-text params working untouched", () => {
    const legacy = parse("q=retro&not=rugby&label=Retro%20Football");
    expect(legacy.q).toBe("retro");
    expect(legacy.not).toBe("rugby");
    expect(legacy.label).toBe("Retro Football");
    expect(legacy.rail).toEqual(EMPTY_RAIL);
  });

  it("reads the 'unspecified' choice back", () => {
    expect(parse("season=unspecified").rail.season).toBe("unspecified");
    expect(parse("slot=unspecified").rail.slot).toBe("unspecified");
    expect(parse("team=unspecified").rail.team).toBe("unspecified");
  });

  // A hand-edited or stale URL must degrade to "no filter". Filtering on a value
  // nothing can match shows an empty archive and never says why.
  it("ignores values this app does not understand", () => {
    expect(parse("version=goalkeeper").rail.version).toBeNull();
    expect(parse("sport=cricket").rail.sport).toBeNull();
    expect(parse("slot=nonsense").rail.slot).toBeNull();
    expect(parse("sort=cheapest").sort).toBe("latest");
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=-3").page).toBe(1);
    expect(parse("maxPrice=abc").rail.maxPrice).toBeNull();
  });

  it("accepts country= as an alias for team=, so National Colours links read naturally", () => {
    expect(parse("country=brazil").rail.team).toBe("brazil");
  });
});

describe("shopHref", () => {
  it("returns to page one when anything but the page changes", () => {
    const onPageFour: ShopQuery = { ...EMPTY_SHOP_QUERY, page: 4 };
    expect(shopHref(onPageFour, { rail: { ...EMPTY_RAIL, version: "fan" } })).toBe("/shop?version=fan");
  });

  it("keeps the page when the page is what changed", () => {
    expect(shopHref(EMPTY_SHOP_QUERY, { page: 3 })).toBe("/shop?page=3");
  });

  it("gives a bare /shop when nothing is left", () => {
    const filtered: ShopQuery = { ...EMPTY_SHOP_QUERY, rail: { ...EMPTY_RAIL, team: "liverpool" } };
    expect(shopHref(filtered, { rail: EMPTY_RAIL })).toBe("/shop");
  });

  it("carries the search term through a filter change", () => {
    const searched: ShopQuery = { ...EMPTY_SHOP_QUERY, q: "arsenal", label: "Arsenal" };
    expect(shopHref(searched, { rail: { ...EMPTY_RAIL, sport: "rugby" } })).toBe(
      "/shop?q=arsenal&label=Arsenal&sport=rugby"
    );
  });
});
