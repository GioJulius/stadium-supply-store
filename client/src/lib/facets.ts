import type { ProductSummary } from "@shared/commerce/types";
import { CANONICAL_TYPES } from "./catalog";
import { TEAM_ENTRIES_BY_TERM_LENGTH, type Sport, type TeamEntry } from "./teams";

/**
 * Facets for the shop filter rail.
 *
 * Everything here is DERIVED from what a listing already says — its title,
 * product type, tags and variants. Nothing new is stored, because the
 * catalogue is imported from several lineages (client WhatsApp batches,
 * supplier albums, Instagram) and none of them carries a structured season or
 * kit-slot field.
 *
 * The consequence is that two of the five facets are genuinely incomplete:
 * on the 445-product catalogue of 4 Sep 2026 only ~57% of titles name a kit
 * slot and ~49% name a season. That is why `season` and `kitSlot` return
 * `null` rather than guessing, and why the rail renders an explicit
 * "Not specified" option for them — a filter that silently swallows half the
 * archive is worse than no filter at all.
 */

export type KitVersion = "fan" | "player" | "retro";
export type KitSlot = "home" | "away" | "third" | "fourth" | "goalkeeper";

/** The order sizes are shown in, smallest first. Anything unrecognised sorts last. */
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

function searchableText(product: ProductSummary): string {
  return [product.title, product.productType ?? "", ...product.tags].join(" ").toLowerCase();
}

/**
 * Version is read as whole words so that "Fanatics" or a club whose name
 * contains "player" cannot match. Retro wins over fan when a listing says
 * both, because a retro shirt sold in fan spec is still shelved as a retro
 * and priced at the retro tier.
 */
function versionFrom(text: string): KitVersion | null {
  if (/\b(retro|vintage)\b/.test(text)) return "retro";
  if (/\bplayer\b/.test(text)) return "player";
  if (/\bfan\b/.test(text)) return "fan";
  return null;
}

/**
 * Seasons are written several ways across the imports — "25/26", "2025/26",
 * "2025-26". All three normalise to the two-digit form the client uses when
 * they talk about stock.
 *
 * Read from the TITLE alone, not the haystack: a tag like "supplier-220065986"
 * is a run of digits that a looser test would happily read a season out of.
 */
function seasonFrom(title: string): string | null {
  const match = /\b(?:20)?(\d{2})\s*[\/-]\s*(?:20)?(\d{2})\b/.exec(title);
  return match ? `${match[1]}/${match[2]}` : null;
}

/**
 * The team a listing belongs to, by longest matching term. A term is only
 * accepted once the entry's disqualifiers have been checked, which is what keeps
 * Kaizer Chiefs and the Super Rugby Chiefs apart.
 */
function teamFrom(text: string): TeamEntry | null {
  for (const { term, entry } of TEAM_ENTRIES_BY_TERM_LENGTH) {
    if (!text.includes(term)) continue;
    if (entry.not?.some(veto => text.includes(veto))) continue;
    return entry;
  }
  return null;
}

/**
 * Which sport a listing belongs to.
 *
 * The order matters, and the first rule is why the team registry exists at all:
 * `productType` describes the GARMENT, so a Ferrari hoodie is a `Hoodie` and the
 * Springboks kids kit is a `Kids Kit`, and neither says "motorsport" or "rugby"
 * anywhere in its category. Only the team knows.
 *
 * National sides do not declare a sport — Ireland and Scotland are rugby in this
 * catalogue today and could be football tomorrow — so they fall through to the
 * garment and then to the wording, which is where "All Blacks" and "Wallabies"
 * are caught on a track jacket that says nothing else about the code.
 *
 * Football is the default because it is the overwhelming bulk of the store, and
 * because a plain adidas tracksuit belonging to no team is better over-included
 * in the main sport than hidden from every filter.
 */
function sportFrom(text: string, team: TeamEntry | null, productType: string | null): Sport {
  if (team?.sport) return team.sport;
  if (productType?.startsWith("Rugby")) return "rugby";
  if (productType?.startsWith("F1")) return "f1";
  if (/\brugby\b|\ball blacks\b|\bwallabies\b|\bspringboks\b|\b7s\b/.test(text)) return "rugby";
  if (/\bf1\b|\bformula\s*1\b|\bgrand prix\b/.test(text)) return "f1";
  return "football";
}

function slotFrom(text: string): KitSlot | null {
  if (/\b(goalkeeper|keeper|\bgk\b)/.test(text)) return "goalkeeper";
  if (/\bfourth\b/.test(text)) return "fourth";
  if (/\bthird\b/.test(text)) return "third";
  if (/\baway\b/.test(text)) return "away";
  if (/\bhome\b/.test(text)) return "home";
  return null;
}

/**
 * Everything derived about one listing, worked out once.
 *
 * The shop asks these questions a great many times: `collectFacets` walks the
 * whole result set to decide what the rail can offer, `applyRail` walks it again
 * to filter, and the nav menu counts every team leaf against the whole
 * catalogue. At 1 249 products and five facets that was tolerable; the team
 * registry that follows is ~60 substring tests per product, and paying that on
 * every price-slider tick would not be.
 *
 * A `WeakMap` keyed on the product object is the right cache here because the
 * tRPC query hands back stable object identities across renders: the facts
 * survive every rail interaction and refill only when the catalogue actually
 * refetches. No eviction policy, no cache key to get wrong, and nothing retained
 * once the query data is replaced.
 *
 * `sizes` is shared rather than copied per call, so treat it as read-only —
 * every caller today only reads it.
 */
export type ProductFacts = {
  /** title + productType + tags, lowercased — the haystack the rules read. */
  text: string;
  version: KitVersion | null;
  season: string | null;
  slot: KitSlot | null;
  sizes: string[];
  price: number;
  longSleeve: boolean;
  team: TeamEntry | null;
  sport: Sport;
  /** The canonical category, or null if this listing carries an unknown one. */
  type: string | null;
};

const FACTS = new WeakMap<ProductSummary, ProductFacts>();

export function factsOf(product: ProductSummary): ProductFacts {
  const cached = FACTS.get(product);
  if (cached) return cached;

  const text = searchableText(product);
  const team = teamFrom(text);
  const type = product.productType && CANONICAL_TYPES.has(product.productType) ? product.productType : null;
  const facts: ProductFacts = {
    text,
    version: versionFrom(text),
    season: seasonFrom(product.title),
    slot: slotFrom(text),
    sizes: sizesFrom(product),
    price: Number(product.priceRange.min.amount),
    longSleeve: /\blong\s*sleeve[sd]?\b/.test(text),
    team,
    sport: sportFrom(text, team, product.productType),
    type,
  };
  FACTS.set(product, facts);
  return facts;
}

export function versionOf(product: ProductSummary): KitVersion | null {
  return factsOf(product).version;
}

export function seasonOf(product: ProductSummary): string | null {
  return factsOf(product).season;
}

export function kitSlotOf(product: ProductSummary): KitSlot | null {
  return factsOf(product).slot;
}

/**
 * Sizes a shopper can actually buy right now. Reading the variants rather
 * than the "Size XL" tag matters: the tag records what was imported, the
 * variant records what is still in stock, and the wireframe's promise is
 * "SIZE — in stock only".
 */
function sizesFrom(product: ProductSummary): string[] {
  const found = new Set<string>();
  for (const variant of product.variants) {
    if (!variant.availableForSale) continue;
    for (const option of variant.selectedOptions) {
      if (option.name.toLowerCase() === "size") found.add(normaliseSize(option.value));
    }
  }
  return sortSizes(Array.from(found));
}

export function sizesInStock(product: ProductSummary): string[] {
  return factsOf(product).sizes;
}

/** "Small" / "2xl" / "XXL" all arrive from different imports; show one spelling. */
function normaliseSize(raw: string): string {
  const value = raw.trim().toUpperCase();
  const spelled: Record<string, string> = { SMALL: "S", MEDIUM: "M", LARGE: "L", "X-LARGE": "XL", "EXTRA LARGE": "XL" };
  if (spelled[value]) return spelled[value];
  const repeated = /^(X{2,})L$/.exec(value);
  if (repeated) return `${repeated[1].length}XL`;
  return value;
}

/**
 * Kids sets are sized by age — "2-3", "10-11" — and sort by the first number,
 * not as text, or the rail offers 10-11 before 2-3. They sit after the adult
 * run because the two are different garments, not a continuous scale.
 */
function ageSize(size: string): number | null {
  const match = /^(\d+)\s*-\s*\d+$/.exec(size);
  return match ? Number(match[1]) : null;
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;

    const aAge = ageSize(a);
    const bAge = ageSize(b);
    if (aAge !== null && bAge !== null) return aAge - bAge;
    if (aAge !== null) return -1;
    if (bAge !== null) return 1;

    return a.localeCompare(b);
  });
}

/**
 * "S–5XL" for the card, or the single size when only one is left. Returns an
 * empty string when nothing is in stock, so the caller can say "Sold out"
 * rather than print a dash.
 */
export function sizeRangeLabel(sizes: string[]): string {
  if (sizes.length === 0) return "";
  if (sizes.length === 1) return sizes[0];
  return `${sizes[0]}–${sizes[sizes.length - 1]}`;
}

export function priceOf(product: ProductSummary): number {
  return factsOf(product).price;
}

/**
 * Groups the listings that are the same kit in different specs, so the product
 * page can offer "also in Player" instead of making version a dead end.
 *
 * Version words, sleeve length and the noun for the garment are stripped; club,
 * season and kit slot are what remain. This is a fuzzy key over free text and
 * it only finds a sibling for roughly a fifth of the catalogue — the product
 * page shows the switcher only where a sibling actually exists rather than
 * implying every kit comes in three versions.
 */
export function kitKey(product: ProductSummary): string {
  return product.title
    .toLowerCase()
    .replace(/\((?:fan|player|authentic)[^)]*\)/g, " ")
    .replace(/\b(fan|player|authentic|retro|vintage)\s*version\b/g, " ")
    .replace(/\b(fan|player|authentic)\b/g, " ")
    .replace(/\blong\s*sleeve[sd]?\b/g, " ")
    .replace(/\b(jersey|shirt|kit|top)\b/g, " ")
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isLongSleeve(product: ProductSummary): boolean {
  return factsOf(product).longSleeve;
}

/** The club, nation or constructor a listing belongs to. */
export function teamOf(product: ProductSummary): TeamEntry | null {
  return factsOf(product).team;
}

/**
 * The nation a listing belongs to, where it belongs to one.
 *
 * A national side only — Real Madrid is Spanish and is not "Spain". The store
 * treats the two as one filter dimension, so this is a reading of the team
 * rather than a facet of its own.
 */
export function countryOf(product: ProductSummary): TeamEntry | null {
  const team = factsOf(product).team;
  return team?.kind === "country" ? team : null;
}

export function sportOf(product: ProductSummary): Sport {
  return factsOf(product).sport;
}

/** The canonical category, or null where a listing carries an unnormalised one. */
export function productTypeOf(product: ProductSummary): string | null {
  return factsOf(product).type;
}

export const VERSION_LABELS: Record<KitVersion, string> = {
  fan: "Fan",
  player: "Player",
  retro: "Retro",
};

export const KIT_SLOT_LABELS: Record<KitSlot, string> = {
  home: "Home",
  away: "Away",
  third: "Third",
  fourth: "Fourth",
  goalkeeper: "Goalkeeper",
};

/**
 * The categories, grouped the way a shopper thinks about them rather than the
 * way the price list is ordered. Sixteen entries in one flat select is a wall;
 * four short groups is a menu. Anything not named here still filters, it just
 * lands under "Other".
 */
export const TYPE_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: "Shirts", types: ["Fan Version", "Player Version", "Retro"] },
  { label: "Kids", types: ["Kids Kit"] },
  {
    label: "Training",
    types: ["Training Set", "Half-Zip Training Set", "Half-Zip Training Top", "Tracksuit", "Plain Tracksuit"],
  },
  { label: "Outerwear", types: ["Jacket / Windbreaker", "Hoodie", "Sweatshirt"] },
  { label: "Rugby", types: ["Rugby Jersey", "Rugby Vest"] },
  { label: "Formula 1", types: ["F1 Jersey", "F1 Jacket"] },
];

export type ShopFacets = {
  versions: KitVersion[];
  sizes: string[];
  seasons: string[];
  slots: KitSlot[];
  sports: Sport[];
  teams: TeamEntry[];
  types: string[];
  priceMin: number;
  priceMax: number;
};

/** What the rail can offer for a given set of products. */
export function collectFacets(products: ProductSummary[]): ShopFacets {
  const versions = new Set<KitVersion>();
  const sizes = new Set<string>();
  const seasons = new Set<string>();
  const slots = new Set<KitSlot>();
  const sports = new Set<Sport>();
  const teams = new Map<string, TeamEntry>();
  const types = new Set<string>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const product of products) {
    const facts = factsOf(product);
    if (facts.version) versions.add(facts.version);
    for (const size of facts.sizes) sizes.add(size);
    if (facts.season) seasons.add(facts.season);
    if (facts.slot) slots.add(facts.slot);
    sports.add(facts.sport);
    if (facts.team) teams.set(facts.team.slug, facts.team);
    if (facts.type) types.add(facts.type);
    if (Number.isFinite(facts.price)) {
      priceMin = Math.min(priceMin, facts.price);
      priceMax = Math.max(priceMax, facts.price);
    }
  }

  return {
    versions: (["fan", "player", "retro"] as KitVersion[]).filter(v => versions.has(v)),
    sizes: sortSizes(Array.from(sizes)),
    // Newest season first — "26/27" above "25/26".
    seasons: Array.from(seasons).sort((a, b) => b.localeCompare(a)),
    slots: (["home", "away", "third", "fourth", "goalkeeper"] as KitSlot[]).filter(s => slots.has(s)),
    sports: (["football", "rugby", "f1"] as Sport[]).filter(s => sports.has(s)),
    teams: Array.from(teams.values()).sort((a, b) => a.label.localeCompare(b.label)),
    // Grouped order, so the select reads the same way every time.
    types: TYPE_GROUPS.flatMap(group => group.types)
      .filter(type => types.has(type))
      .concat(Array.from(types).filter(type => !TYPE_GROUPS.some(g => g.types.includes(type))).sort()),
    priceMin: Number.isFinite(priceMin) ? Math.floor(priceMin) : 0,
    priceMax: Math.ceil(priceMax) || 0,
  };
}

/**
 * The rail's live state. `null` means the facet is not being filtered on;
 * `"unspecified"` is the shopper explicitly asking for the listings that never
 * declared one, which is how the incomplete facets stay honest.
 */
export type RailState = {
  version: KitVersion | null;
  sizes: string[];
  season: string | "unspecified" | null;
  slot: KitSlot | "unspecified" | null;
  sport: Sport | null;
  /** A `TEAM_REGISTRY` slug, or `"unspecified"` for stock with no team at all. */
  team: string | "unspecified" | null;
  /** A canonical `productType`. */
  type: string | null;
  maxPrice: number | null;
};

export const EMPTY_RAIL: RailState = {
  version: null,
  sizes: [],
  season: null,
  slot: null,
  sport: null,
  team: null,
  type: null,
  maxPrice: null,
};

export function railIsActive(rail: RailState): boolean {
  return Boolean(
    rail.version ||
      rail.sizes.length ||
      rail.season ||
      rail.slot ||
      rail.sport ||
      rail.team ||
      rail.type ||
      rail.maxPrice !== null
  );
}

export function applyRail(products: ProductSummary[], rail: RailState): ProductSummary[] {
  return products.filter(product => {
    const facts = factsOf(product);

    if (rail.version && facts.version !== rail.version) return false;

    if (rail.sizes.length && !rail.sizes.some(size => facts.sizes.includes(size))) return false;

    if (rail.season) {
      if (rail.season === "unspecified" ? facts.season !== null : facts.season !== rail.season) return false;
    }

    if (rail.slot) {
      if (rail.slot === "unspecified" ? facts.slot !== null : facts.slot !== rail.slot) return false;
    }

    if (rail.sport && facts.sport !== rail.sport) return false;

    if (rail.team) {
      const slug = facts.team?.slug ?? null;
      if (rail.team === "unspecified" ? slug !== null : slug !== rail.team) return false;
    }

    if (rail.type && facts.type !== rail.type) return false;

    if (rail.maxPrice !== null && facts.price > rail.maxPrice) return false;

    return true;
  });
}
