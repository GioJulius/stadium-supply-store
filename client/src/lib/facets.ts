import type { Product } from "@shared/commerce/types";
import { isGroup, SHOP_MENU, type NavLeaf, type NavNode } from "./navigation";

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

function searchableText(product: Product): string {
  return [product.title, product.productType ?? "", ...product.tags].join(" ").toLowerCase();
}

/**
 * Version is read as whole words so that "Fanatics" or a club whose name
 * contains "player" cannot match. Retro wins over fan when a listing says
 * both, because a retro shirt sold in fan spec is still shelved as a retro
 * and priced at the retro tier.
 */
export function versionOf(product: Product): KitVersion | null {
  const text = searchableText(product);
  if (/\b(retro|vintage)\b/.test(text)) return "retro";
  if (/\bplayer\b/.test(text)) return "player";
  if (/\bfan\b/.test(text)) return "fan";
  return null;
}

/**
 * Seasons are written several ways across the imports — "25/26", "2025/26",
 * "2025-26". All three normalise to the two-digit form the client uses when
 * they talk about stock.
 */
export function seasonOf(product: Product): string | null {
  const match = /\b(?:20)?(\d{2})\s*[\/-]\s*(?:20)?(\d{2})\b/.exec(product.title);
  return match ? `${match[1]}/${match[2]}` : null;
}

export function kitSlotOf(product: Product): KitSlot | null {
  const text = searchableText(product);
  if (/\b(goalkeeper|keeper|\bgk\b)/.test(text)) return "goalkeeper";
  if (/\bfourth\b/.test(text)) return "fourth";
  if (/\bthird\b/.test(text)) return "third";
  if (/\baway\b/.test(text)) return "away";
  if (/\bhome\b/.test(text)) return "home";
  return null;
}

/**
 * Sizes a shopper can actually buy right now. Reading the variants rather
 * than the "Size XL" tag matters: the tag records what was imported, the
 * variant records what is still in stock, and the wireframe's promise is
 * "SIZE — in stock only".
 */
export function sizesInStock(product: Product): string[] {
  const found = new Set<string>();
  for (const variant of product.variants) {
    if (!variant.availableForSale) continue;
    for (const option of variant.selectedOptions) {
      if (option.name.toLowerCase() === "size") found.add(normaliseSize(option.value));
    }
  }
  return sortSizes(Array.from(found));
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

export function priceOf(product: Product): number {
  return Number(product.priceRange.min.amount);
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
export function kitKey(product: Product): string {
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

export function isLongSleeve(product: Product): boolean {
  return /\blong\s*sleeve[sd]?\b/i.test(searchableText(product));
}

/**
 * The club or nation a listing belongs to, for the product page breadcrumb.
 *
 * `productType` cannot answer this — it holds the pricing category ("Soccer Fan
 * Version"), not the badge. The shop menu already knows every team the store
 * stocks and the free-text term each one is found by, so the breadcrumb reuses
 * that list rather than starting a second, drifting one.
 *
 * The longest matching term wins, so "Manchester City" cannot be answered with
 * "Manchester United"'s entry, and a listing that matches nothing returns null
 * rather than inventing a crumb.
 */
const TEAM_SECTIONS = new Set(["Club Team", "National Colours"]);

function leavesUnder(nodes: NavNode[]): NavLeaf[] {
  return nodes.flatMap(node => (isGroup(node) ? leavesUnder(node.children) : [node]));
}

const TEAM_LEAVES: NavLeaf[] = SHOP_MENU
  .filter(section => TEAM_SECTIONS.has(section.label) && section.children)
  .flatMap(section => leavesUnder(section.children!))
  .sort((a, b) => b.q.length - a.q.length);

export function clubOf(product: Product): string | null {
  const text = searchableText(product);
  const hit = TEAM_LEAVES.find(leaf => text.includes(leaf.q.toLowerCase()));
  return hit ? hit.label : null;
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

export type ShopFacets = {
  versions: KitVersion[];
  sizes: string[];
  seasons: string[];
  slots: KitSlot[];
  priceMin: number;
  priceMax: number;
};

/** What the rail can offer for a given set of products. */
export function collectFacets(products: Product[]): ShopFacets {
  const versions = new Set<KitVersion>();
  const sizes = new Set<string>();
  const seasons = new Set<string>();
  const slots = new Set<KitSlot>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const product of products) {
    const version = versionOf(product);
    if (version) versions.add(version);
    for (const size of sizesInStock(product)) sizes.add(size);
    const season = seasonOf(product);
    if (season) seasons.add(season);
    const slot = kitSlotOf(product);
    if (slot) slots.add(slot);
    const price = priceOf(product);
    if (Number.isFinite(price)) {
      priceMin = Math.min(priceMin, price);
      priceMax = Math.max(priceMax, price);
    }
  }

  return {
    versions: (["fan", "player", "retro"] as KitVersion[]).filter(v => versions.has(v)),
    sizes: sortSizes(Array.from(sizes)),
    // Newest season first — "26/27" above "25/26".
    seasons: Array.from(seasons).sort((a, b) => b.localeCompare(a)),
    slots: (["home", "away", "third", "fourth", "goalkeeper"] as KitSlot[]).filter(s => slots.has(s)),
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
  maxPrice: number | null;
};

export const EMPTY_RAIL: RailState = { version: null, sizes: [], season: null, slot: null, maxPrice: null };

export function railIsActive(rail: RailState): boolean {
  return Boolean(rail.version || rail.sizes.length || rail.season || rail.slot || rail.maxPrice !== null);
}

export function applyRail(products: Product[], rail: RailState): Product[] {
  return products.filter(product => {
    if (rail.version && versionOf(product) !== rail.version) return false;

    if (rail.sizes.length) {
      const available = sizesInStock(product);
      if (!rail.sizes.some(size => available.includes(size))) return false;
    }

    if (rail.season) {
      const season = seasonOf(product);
      if (rail.season === "unspecified" ? season !== null : season !== rail.season) return false;
    }

    if (rail.slot) {
      const slot = kitSlotOf(product);
      if (rail.slot === "unspecified" ? slot !== null : slot !== rail.slot) return false;
    }

    if (rail.maxPrice !== null && priceOf(product) > rail.maxPrice) return false;

    return true;
  });
}
