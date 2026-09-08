/**
 * The shop's state, expressed as a URL.
 *
 * Filters, sort and page used to live in `useState` inside `Shop.tsx`, which
 * meant a filtered view could not be shared, linked to from the menu, or
 * survive a reload — and Back skipped the whole visit rather than undoing one
 * filter. This module is the single place the parameters are named, so the
 * parsing and the writing cannot disagree about what a filter is called.
 *
 * TWO RULES HOLD THE OLD LINKS WORKING.
 *
 * `q`, `not` and `label` keep their exact meaning: a free-text term, an
 * exclusion, and the wording the heading reads back. They are the mechanism the
 * nav menu, the prerendered shells and anything already shared to WhatsApp use,
 * and `textMatchProducts` still runs before the facets, so facet params compose
 * on top of a search rather than replacing it. A legacy `?q=arsenal` therefore
 * behaves exactly as it did.
 *
 * And DEFAULTS ARE NEVER WRITTEN. `/shop` stays the same URL it has always
 * been, so the canonical in the prerendered HTML is untouched and a shopper who
 * has chosen nothing gets a clean address bar.
 */
import {
  EMPTY_RAIL,
  type KitSlot,
  type KitVersion,
  type RailState,
} from "./facets";
import type { CatalogSortMode } from "./catalog";
import type { Sport } from "./teams";

export type ShopQuery = {
  q: string;
  not: string;
  label: string;
  rail: RailState;
  sort: CatalogSortMode;
  page: number;
};

export const EMPTY_SHOP_QUERY: ShopQuery = {
  q: "",
  not: "",
  label: "",
  rail: EMPTY_RAIL,
  sort: "latest",
  page: 1,
};

const VERSIONS: KitVersion[] = ["fan", "player", "retro"];
const SLOTS: KitSlot[] = ["home", "away", "third", "fourth", "goalkeeper"];
const SPORTS: Sport[] = ["football", "rugby", "f1"];
const SORTS: CatalogSortMode[] = ["latest", "price-asc", "price-desc", "name-asc"];

/**
 * A value is only accepted if it is one this app actually understands, so a
 * hand-edited or stale URL degrades to "no filter" instead of filtering on a
 * string nothing can match and showing an empty archive with no explanation.
 */
function oneOf<T extends string>(value: string | null, allowed: T[]): T | null {
  return value && (allowed as string[]).includes(value) ? (value as T) : null;
}

export function parseShopParams(params: URLSearchParams): ShopQuery {
  const sizes = (params.get("size") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const maxPrice = Number(params.get("maxPrice"));
  const page = Number(params.get("page"));

  const season = params.get("season");
  const slot = params.get("slot");
  const team = params.get("team") ?? params.get("country");

  return {
    q: params.get("q") ?? "",
    not: params.get("not") ?? "",
    label: params.get("label") ?? "",
    rail: {
      version: oneOf(params.get("version"), VERSIONS),
      sizes,
      // "unspecified" is a real choice — the listings that never declared one —
      // so it is accepted alongside the values themselves.
      season: season === "unspecified" ? "unspecified" : season || null,
      slot: slot === "unspecified" ? "unspecified" : oneOf(slot, SLOTS),
      sport: oneOf(params.get("sport"), SPORTS),
      team: team || null,
      type: params.get("type") || null,
      maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null,
    },
    sort: oneOf(params.get("sort"), SORTS) ?? "latest",
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
  };
}

export function toShopParams(query: ShopQuery): URLSearchParams {
  const params = new URLSearchParams();
  const { rail } = query;

  if (query.q) params.set("q", query.q);
  if (query.not) params.set("not", query.not);
  if (query.label) params.set("label", query.label);

  if (rail.sport) params.set("sport", rail.sport);
  if (rail.team) params.set("team", rail.team);
  if (rail.type) params.set("type", rail.type);
  if (rail.version) params.set("version", rail.version);
  if (rail.sizes.length) params.set("size", rail.sizes.join(","));
  if (rail.season) params.set("season", rail.season);
  if (rail.slot) params.set("slot", rail.slot);
  if (rail.maxPrice !== null) params.set("maxPrice", String(rail.maxPrice));

  if (query.sort !== "latest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));

  return params;
}

/**
 * The URL for a change to the current view.
 *
 * Changing anything but the page returns to page one, because page 4 of a
 * filter you just narrowed is usually past the end of it — the same correction
 * the old `setPage(1)` effect made, expressed as part of the address rather
 * than as a side effect that fires after the render.
 */
export function shopHref(from: ShopQuery, patch: Partial<ShopQuery>): string {
  const next: ShopQuery = { ...from, ...patch };
  if (patch.page === undefined) next.page = 1;
  const params = toShopParams(next);
  const search = params.toString();
  return search ? `/shop?${search}` : "/shop";
}
