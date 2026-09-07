/**
 * One name per category, in `productType` and in the category tags.
 *
 * The catalogue was imported in several lineages that each invented their own
 * wording, so the same category arrived under two, three or four names:
 * "Soccer Fan Version" beside "Fan Version", "Soccer Retro/Vintage" beside
 * "Retro", "Windbreaker or jacket" beside "Jacket / Windbreaker", and a
 * lowercase "Half-zip training tracksuit" beside the title-case one. 28
 * distinct values for what the client's price list treats as far fewer
 * categories.
 *
 * It shows: `productType` is the eyebrow on the product page and the fallback
 * badge on every card, so two shoppers looking at the same garment could see
 * two different words for it. It will matter more when the team/type navigation
 * filters are built, because a filter over these values would offer "Retro" and
 * "Soccer Retro" as separate choices.
 *
 * Nothing in the app branches on the exact string — `productType` is folded
 * into the search haystack alongside the title and tags, and rendered raw —
 * so a rename is safe as long as the canonical name keeps the words the rules
 * look for: "retro"/"vintage" and "player"/"fan" for `versionOf()`, and
 * "training"/"jacket"/"windbreaker"/"tracksuit"/"hood" for the NON_SHIRT test
 * that decides whether a listing can be printed. Every mapping below does.
 *
 * TWO KINDS OF CHANGE, and only the first is a rename:
 *
 *   1. SYNONYMS — a different spelling of the same category. Safe, mechanical.
 *
 *   2. HALF-ZIP, where the type contradicts the title. 23 listings say one
 *      thing in the title and the other in the type ("... Half-Zip Training
 *      Set" typed `Half-Zip Training Top`, and the reverse). The title is the
 *      name the customer reads and the one written from the client's own
 *      caption, so the title decides. Every half-zip title in the catalogue is
 *      decisive — none is silent on set-vs-top — so this needs no guesswork.
 *
 * The same duplicated vocabulary is in the TAGS — "Soccer Fan Version" is a tag
 * on 57 listings as well as a type on 76 — and a tag is what a navigation
 * filter would most likely read, so both surfaces are normalised together or
 * the duplication simply survives in the one that matters later.
 *
 * Only a tag whose value is EXACTLY one of the duplicate category names is
 * touched. Every other tag is carried through untouched, which matters more
 * than it sounds: `Mapped Media` and `Editable Drop` decide whether a product
 * is customer-facing at all, `instagram-stock` and the `ig-post-NNN` markers
 * drive the default "newest" ordering, and the club names are the nav tree.
 * Losing any of those would take products off the shop rather than rename them.
 *
 * Deliberately NOT merged:
 *   - `Tracksuit` (R1000, club) vs `Plain Tracksuit` (R700/R850, unbranded
 *     adidas/Nike). Confusable names, but different price tiers and different
 *     products. Renaming those is the client's call, not a de-duplication.
 *   - `Hoodie` / `Sweatshirt`, `Rugby Jersey` / `Rugby Vest`, `F1 Jersey` /
 *     `F1 Jacket` — all genuinely distinct garments.
 *
 *   node scripts/normalise-product-types.mjs            # dry run
 *   node scripts/normalise-product-types.mjs --apply
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n").filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const TOKEN = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const APPLY = process.argv.includes("--apply");

/** Same category, different spelling. */
const SYNONYMS = {
  "Soccer Fan Version": "Fan Version",
  // Every one of these twelve says "Long Sleeve" in its own title, so the type
  // was carrying a detail the title already tells the shopper.
  "Soccer Fan Version Long Sleeve": "Fan Version",
  "Soccer Player Version": "Player Version",
  "Soccer Retro": "Retro",
  "Soccer Retro/Vintage": "Retro",
  "Kiddies soccer set": "Kids Kit",
  "Training Top & Shorts": "Training Set",
  "Training top and shorts": "Training Set",
  "Windbreaker or jacket": "Jacket / Windbreaker",
  "Jacket": "Jacket / Windbreaker",
  "Half-zip training tracksuit": "Half-Zip Training Set",
};

const HALF_ZIP = ["Half-Zip Training Set", "Half-Zip Training Top", "Half-zip training tracksuit"];

/** For a half-zip, the title says whether it is a set or a top. */
function halfZipTypeFromTitle(title) {
  const t = title.toLowerCase();
  if (/\b(set|tracksuit|kit)\b/.test(t)) return "Half-Zip Training Set";
  if (/\b(top|jacket|jersey|shirt)\b/.test(t)) return "Half-Zip Training Top";
  return null; // silent title — leave it alone rather than guess
}

function canonicalType(product) {
  if (HALF_ZIP.includes(product.productType)) {
    return halfZipTypeFromTitle(product.title) ?? product.productType;
  }
  return SYNONYMS[product.productType] ?? product.productType;
}

/**
 * Tags, with the category ones brought onto the same names as the types.
 *
 * A half-zip whose type moved from Set to Top on the strength of its title
 * would otherwise keep the old word in its tags and contradict itself, so its
 * category tag follows the type. Order is preserved and duplicates collapse,
 * because the canonical tag is usually already there beside the old one.
 */
function canonicalTags(product, type) {
  const out = [];
  for (const tag of product.tags) {
    let next = tag;
    if (HALF_ZIP.includes(tag)) next = type && HALF_ZIP.includes(type) ? type : tag;
    else if (SYNONYMS[tag]) next = SYNONYMS[tag];
    if (!out.includes(next)) out.push(next);
  }
  return out;
}

const sameTags = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (body.errors?.some(e => e.extensions?.code === "THROTTLED") && attempt < 6) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

const PAGE = `query($cursor:String){
  products(first:250, after:$cursor){
    pageInfo{ hasNextPage endCursor }
    edges{ node{ id handle title productType tags } }
  }
}`;

const products = [];
let cursor = null;
do {
  const page = (await gql(PAGE, { cursor })).products;
  products.push(...page.edges.map(e => e.node));
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (cursor);

const changes = [];
for (const p of products) {
  const to = canonicalType(p);
  const tags = canonicalTags(p, to);
  const typeMoved = Boolean(to) && to !== p.productType;
  const tagsMoved = !sameTags(p.tags, tags);
  if (typeMoved || tagsMoved) changes.push({ ...p, oldTags: p.tags, to, tags, typeMoved, tagsMoved });
}

const byType = new Map();
const byTag = new Map();
for (const c of changes) {
  if (c.typeMoved) {
    const key = `${c.productType}  ->  ${c.to}`;
    byType.set(key, (byType.get(key) ?? 0) + 1);
  }
  if (!c.tagsMoved) continue;
  for (const tag of c.oldTags) {
    const to = HALF_ZIP.includes(tag)
      ? (HALF_ZIP.includes(c.to) ? c.to : tag)
      : SYNONYMS[tag];
    if (!to || to === tag) continue;
    byTag.set(`${tag}  ->  ${to}`, (byTag.get(`${tag}  ->  ${to}`) ?? 0) + 1);
  }
}

// Nothing but a category name may leave a product. If any other tag would be
// dropped, the mapping has reached somewhere it should not: `Mapped Media` and
// `Editable Drop` decide whether a product appears in the shop at all, and the
// club names are the nav tree. Stop rather than write.
const losing = changes
  .map(c => ({ c, gone: c.oldTags.filter(t => !c.tags.includes(t)) }))
  .filter(({ gone }) => gone.some(t => !HALF_ZIP.includes(t) && !SYNONYMS[t]));
if (losing.length) {
  console.error(`REFUSING: ${losing.length} product(s) would lose a tag that is not a category name`);
  for (const { c, gone } of losing.slice(0, 10)) console.error(`  ${c.handle}: ${gone.join(", ")}`);
  process.exit(1);
}

const typed = changes.filter(c => c.typeMoved).length;
const tagged = changes.filter(c => c.tagsMoved).length;
console.log(`${products.length} products — ${typed} retyped, ${tagged} retagged, ${changes.length} to write`);
console.log("");
console.log("productType");
for (const [move, n] of [...byType].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${move}`);
}
console.log("");
console.log("category tags");
for (const [move, n] of [...byTag].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${move}`);
}
console.log("");

const before = new Set(products.map(p => p.productType).filter(Boolean));
const after = new Set(products.map(p => canonicalType(p)).filter(Boolean));
console.log(`\ndistinct types: ${before.size} -> ${after.size}`);
console.log([...after].sort().map(t => `  ${t}`).join("\n"));

if (!APPLY) {
  console.log("\ndry run — pass --apply to write these types");
  process.exit(0);
}

const UPDATE = `mutation($product:ProductUpdateInput!){
  productUpdate(product:$product){ userErrors{ field message } } }`;

let done = 0;
for (const c of changes) {
  const errs = (await gql(UPDATE, {
    product: { id: c.id, productType: c.to, tags: c.tags },
  })).productUpdate.userErrors;
  if (errs.length) throw new Error(`${c.handle}: ${JSON.stringify(errs)}`);
  done++;
  if (done % 25 === 0) console.log(`  ${done}/${changes.length}`);
}
console.log(`\nretyped ${done} product(s)`);
