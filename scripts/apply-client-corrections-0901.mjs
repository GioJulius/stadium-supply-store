/**
 * The client's 1 Sep 2026 catalogue review, plus the categorisation sweep it
 * exposed.
 *
 * Three separate jobs, in order:
 *
 * 1. NAMED CORRECTIONS - the products the client called out one by one. Each
 *    carries the client's own words in `why`, because several of these reverse
 *    what an earlier import decided, and the reason is the only thing that
 *    makes the change reviewable later.
 *
 * 2. RETYPING - `Football Jersey` was a junk drawer: 25 shirts whose real
 *    version already sat in their tags. Nothing here is inferred from a photo
 *    or a price; the tag decides, so the mapping is auditable and reversible.
 *    The one-off types (`Jacket`, `Chinese Jacket`, `Tracksuit`,
 *    `Football Training Wear`) fold into the type that already holds their
 *    peers, so the menu stops splitting six jackets across three headings.
 *
 * 3. SIZING - the client's 31 Aug rule, now enforced in BOTH directions.
 *    `apply-client-sizing.mjs` only ever added variants, so a shirt demoted
 *    from fan to player kept its 3XL and 4XL and would have sold a size the
 *    supplier does not cut. Oversize variants are deleted, missing ones made.
 *
 * Usage: node scripts/apply-client-corrections-0901.mjs [--apply]
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (r.status === 429 && attempt < 5) {
      await new Promise(s => setTimeout(s, 2000 * (attempt + 1)));
      continue;
    }
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
}

/** Surfaces userErrors instead of letting a mutation fail silently. */
function check(label, payload) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(`${label}: ${JSON.stringify(errs)}`);
  return payload;
}

// ---- The client's named corrections ----------------------------------------

const FAN = "Soccer Fan Version";
const PLAYER = "Soccer Player Version";
const RETRO = "Soccer Retro";

const CORRECTIONS = [
  {
    handle: "paris-saint-germain-2021-22-fourth-long-sleeve-jersey",
    why: "client: 'this is a half zip tracksuit not fan version'",
    type: "Half-Zip Training Top",
    price: "850.00",
    title: "Paris Saint-Germain 2021/22 Half-Zip Training Top",
    dropTags: ["Soccer Fan Version Long Sleeve", "Fan Version"],
    addTags: ["Half-Zip Training Top"],
  },
  {
    handle: "paris-saint-germain-2024-25-home-jersey-doue-14",
    why: "client: 'these are player versions'",
    type: PLAYER,
    price: "650.00",
    title: "Paris Saint-Germain 2024/25 Home Jersey — Doué 14 Player Version",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Player Version", "Soccer Player Version"],
  },
  {
    handle: "paris-saint-germain-2024-25-away-jersey-doue-14",
    why: "client: 'these are player versions'",
    type: PLAYER,
    price: "650.00",
    title: "Paris Saint-Germain 2024/25 Away Jersey — Doué 14 Player Version",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Player Version", "Soccer Player Version"],
  },
  {
    // "Fly Emirates" on the front dates this to 2018/19 or earlier - PSG's
    // shirt sponsor became Accor from 2019/20 - which corroborates the
    // client's own dating rather than relying on it alone.
    handle: "paris-saint-germain-2023-24-home-jersey-jordan",
    why: "client: 'this is a retro 2018/2019'",
    type: RETRO,
    price: "700.00",
    title: "Paris Saint-Germain 2018/19 Fourth Retro Jersey (Jordan)",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Retro", "Soccer Retro"],
  },
  {
    handle: "paris-saint-germain-2023-24-away-jersey-neymar-10",
    why: "client: 'this is a retro 2018/2019'",
    type: RETRO,
    price: "700.00",
    title: "Paris Saint-Germain 2018/19 Fourth Retro Jersey — Neymar 10 (Jordan)",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Retro", "Soccer Retro"],
  },
  {
    handle: "germany-2024-25-home-jersey",
    why: "client: 'this is fan version 2026 world cup'",
    type: FAN,
    price: "500.00",
    title: "Germany 2026 World Cup Home Jersey",
    dropTags: ["Player Version", "Soccer Player Version"],
    addTags: ["Fan Version", "Soccer Fan Version", "World Cup"],
  },
  {
    handle: "germany-2024-home-jersey-13",
    why: "client: 'this is a player version'",
    type: PLAYER,
    price: "650.00",
    title: "Germany 2024/25 Home Jersey — Müller 13 Player Version",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Player Version", "Soccer Player Version"],
  },
  {
    handle: "south-africa-2024-25-gk-jersey-kappa-kombat",
    why: "client: 'this is a retro so until 2XL and price must be for a retro'",
    type: RETRO,
    price: "700.00",
    title: "South Africa Retro Goalkeeper Jersey (Kappa Kombat)",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Retro", "Soccer Retro"],
  },
  {
    handle: "south-africa-2024-25-home-jersey-safa",
    why: "client: 'this is player version so until 2xl and price is player version'",
    type: PLAYER,
    price: "650.00",
    title: "South Africa 2024/25 Home Jersey (SAFA) Player Version",
    dropTags: ["Fan Version", "Soccer Fan Version"],
    addTags: ["Player Version", "Soccer Player Version"],
  },
  // "there's no women jersey ... all jerseys are unisex". Only the misleading
  // word comes out; nothing else about these listings is asserted, because
  // which kit the supplier photographed is not something a rename can settle.
  {
    handle: "2026-27-manchester-united-home-womens-shirt",
    why: "client: 'all jerseys are unisex'",
    title: "2026/27 Manchester United Home Shirt",
  },
  {
    handle: "2026-27-liverpool-home-womens-shirt",
    why: "client: 'all jerseys are unisex'",
    title: "2026/27 Liverpool Home Shirt",
  },
  {
    handle: "2026-27-real-madrid-home-womens-shirt",
    why: "client: 'all jerseys are unisex'",
    title: "2026/27 Real Madrid Home Shirt",
  },
  // Discontinued, so it leaves the storefront. Drafted rather than deleted, so
  // the record and its order history survive if they ever restock it.
  {
    handle: "orlando-pirates-2024-25-training-kit-pants-vodacom",
    why: "client: 'we no longer sell this tracksuit'",
    discontinue: true,
  },
  // The two `Football Training Wear` listings are different garments and had to
  // be split by hand rather than folded as a pair: one is a hooded jacket, the
  // other a short-sleeve pre-match shirt. Its R600 price is left alone — that is
  // the client's to confirm against the R500 fan rate, not ours to assume.
  {
    handle: "arsenal-2024-25-training-hoodie",
    why: "one-off type; it is a hoodie and sits with the other hoodies",
    type: "Hoodie",
  },
  {
    handle: "liverpool-2025-26-training-jersey",
    why: "one-off type; short-sleeve fan-version shirt, findable under the Fan chip",
    type: FAN,
  },
];

// ---- Type consolidation ----------------------------------------------------

/** `Football Jersey` says nothing; the tag beside it already says everything. */
const BY_TAG = { "Fan Version": FAN, "Player Version": PLAYER, Retro: RETRO };

/** One-off types that only ever fragmented the menu. */
const FOLD = {
  Jacket: "Jacket / Windbreaker",
  "Chinese Jacket": "Jacket / Windbreaker",
  Tracksuit: "Jacket / Windbreaker",
};

// ---- Sizing (client, 31 Aug 2026) ------------------------------------------

const SIZES = {
  fan: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  standard: ["S", "M", "L", "XL", "2XL"],
  rugby: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
};

function sizeRuleFor(type, tags = []) {
  if (type === "Soccer Fan Version" || type === "Soccer Fan Version Long Sleeve") return SIZES.fan;
  if (type === "Rugby Jersey" || type === "Rugby Vest") return SIZES.rugby;
  // Age-graded, single-variant, or unresolved listings are left alone.
  if (type === "Kids Kit" || type === "Service" || type === "Football Kit") return null;
  // The client gave two rules that collide on a rugby track jacket: "rugby
  // until 5xl" and "tracksuits and windbreakers until 2xl". Rather than delete
  // three sizes a shopper can buy today on our reading of which rule wins, any
  // rugby-tagged garment keeps its range and the question goes back to them.
  if (tags.some(t => /^rugby$/i.test(t))) return null;
  return SIZES.standard; // player, retro, jackets, hoodies, half-zips, F1
}

// ---- Run -------------------------------------------------------------------

const ALL = `query($cursor:String){ products(first:100, after:$cursor){
  pageInfo{hasNextPage endCursor}
  edges{node{ id handle title productType tags status
    variants(first:100){edges{node{ id title price }}} }} } }`;

let cursor = null;
const products = [];
do {
  const d = await gql(ALL, { cursor });
  products.push(...d.products.edges.map(e => e.node));
  cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
} while (cursor);

const byHandle = new Map(products.map(p => [p.handle, p]));
const plan = [];

for (const c of CORRECTIONS) {
  const p = byHandle.get(c.handle);
  if (!p) {
    console.log(`  !! missing handle: ${c.handle}`);
    continue;
  }
  plan.push({ product: p, ...c });
}

const named = new Set(CORRECTIONS.map(c => c.handle));
for (const p of products) {
  if (p.status !== "ACTIVE" || named.has(p.handle)) continue;
  let type = null;
  if (p.productType === "Football Jersey") {
    const tag = p.tags.find(t => BY_TAG[t]);
    if (tag) type = BY_TAG[tag];
  } else if (FOLD[p.productType]) {
    type = FOLD[p.productType];
  }
  if (type && type !== p.productType) {
    plan.push({ product: p, type, why: `retype from "${p.productType}"` });
  }
}

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} - ${plan.length} products queued\n`);

let touched = 0;
for (const step of plan) {
  const p = step.product;
  const fields = {};
  if (step.title && step.title !== p.title) fields.title = step.title;
  if (step.type && step.type !== p.productType) fields.productType = step.type;

  const tags = new Set(p.tags);
  (step.dropTags ?? []).forEach(t => tags.delete(t));
  (step.addTags ?? []).forEach(t => tags.add(t));
  if (step.discontinue) {
    tags.delete("Mapped Media");
    tags.delete("Editable Drop");
  }
  if ([...tags].sort().join("|") !== [...p.tags].sort().join("|")) fields.tags = [...tags];
  if (step.discontinue) fields.status = "DRAFT";

  const effType = step.type ?? p.productType;
  const want = step.discontinue ? null : sizeRuleFor(effType, p.tags);
  const have = p.variants.edges.map(e => e.node);
  const extra = want ? have.filter(v => !want.includes(v.title) && v.title !== "Default Title") : [];
  const missing = want ? want.filter(s => !have.some(v => v.title === s)) : [];
  const repriced = step.price ? have.filter(v => v.price !== step.price) : [];

  const bits = [];
  if (fields.title) bits.push(`title -> "${fields.title}"`);
  if (fields.productType) bits.push(`type -> ${fields.productType}`);
  if (step.price && repriced.length) bits.push(`price -> R${step.price.replace(".00", "")} (${repriced.length} variants)`);
  if (extra.length) bits.push(`drop ${extra.map(v => v.title).join(",")}`);
  if (missing.length) bits.push(`add ${missing.join(",")}`);
  if (fields.status) bits.push("status -> DRAFT");
  if (!bits.length && !fields.tags) continue;

  touched++;
  console.log(`- ${p.title}`);
  console.log(`    ${step.why}`);
  bits.forEach(b => console.log(`    ${b}`));

  if (!APPLY) continue;

  if (Object.keys(fields).length) {
    check("productUpdate", (await gql(
      "mutation($input:ProductInput!){productUpdate(input:$input){userErrors{field message}}}",
      { input: { id: p.id, ...fields } })).productUpdate);
  }
  if (repriced.length) {
    check("bulkUpdate", (await gql(
      "mutation($pid:ID!,$vars:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$pid,variants:$vars){userErrors{field message}}}",
      { pid: p.id, vars: repriced.map(v => ({ id: v.id, price: step.price })) })).productVariantsBulkUpdate);
  }
  if (missing.length) {
    check("bulkCreate", (await gql(
      "mutation($pid:ID!,$vars:[ProductVariantsBulkInput!]!){productVariantsBulkCreate(productId:$pid,variants:$vars){userErrors{field message}}}",
      {
        pid: p.id,
        vars: missing.map(s => ({
          price: step.price ?? have[0]?.price ?? "500.00",
          optionValues: [{ name: s, optionName: "Size" }],
          inventoryItem: { tracked: false },
        })),
      })).productVariantsBulkCreate);
  }
  // Deleted last: Shopify refuses to remove a product's final variant, and
  // creating the replacements first means that can never be what we are doing.
  if (extra.length) {
    check("bulkDelete", (await gql(
      "mutation($pid:ID!,$ids:[ID!]!){productVariantsBulkDelete(productId:$pid,variantsIds:$ids){userErrors{field message}}}",
      { pid: p.id, ids: extra.map(v => v.id) })).productVariantsBulkDelete);
  }
}
console.log(`\n${touched} products ${APPLY ? "updated" : "would change"}`);
if (!APPLY) console.log("dry run - re-run with --apply");
