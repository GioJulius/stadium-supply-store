/**
 * Brings every live price onto the client's 7 September 2026 price list.
 *
 * That list (recorded verbatim in `price-list-2026-09-07.md`) is the first one
 * that covers every category the store sells, and it settles two things that
 * earlier batches had to guess at:
 *
 *   - An adults training or vest set is **R700**, not R600. R600 is the price of
 *     a PLAIN adidas/Nike training top and shorts, which is a different product.
 *     Every club training set imported before today went in at R600.
 *   - There is no R1000 half-zip. A half-zip training tracksuit is R850, which
 *     means the thirteen retro training tops priced from the client's one-off
 *     "retro training top R1000" caption on 5 September are R150 over.
 *
 * F1 is deliberately left alone. Its outerwear sits at R1200 as its own tier
 * above the standing table, which the client set in the 1 September batch, and
 * the new list does not contradict it.
 *
 * The table is built from rules and printed in full before anything is written.
 *
 *   node scripts/apply-price-list-0907.mjs            # dry run
 *   node scripts/apply-price-list-0907.mjs --apply
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
const CATALOG = process.argv.includes("--catalog")
  ? process.argv[process.argv.indexOf("--catalog") + 1]
  : ".dupcheck/catalog-0907.json";

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (body.errors?.some(e => e.extensions?.code === "THROTTLED") && attempt < 5) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

const products = JSON.parse(readFileSync(CATALOG, "utf8"));

/** F1 prices its own way — see the header. */
const isF1 = p =>
  (p.type || "").startsWith("F1") ||
  /ferrari|mclaren|red bull racing|mercedes-amg|aston martin f1|williams racing/i.test(p.title);

/** A few listings carry the wrong productType, so the TITLE decides first:
 *  a half-zip is R850 whatever its type field says. */
const isHalfZip = p => /half[- ]?zip/i.test(p.title);

const RULES = [
  {
    why: "half-zip by title, whatever the product type says — R850",
    match: p => isHalfZip(p) && ["600.00", "800.00", "1000.00"].includes(p.price),
    price: "850.00",
  },
  {
    why: "adults training or vest set is R700 (R600 is the PLAIN adidas/Nike set)",
    match: p => !isHalfZip(p) && ["Training Set", "Training Top & Shorts", "Training top and shorts"].includes(p.type) && p.price === "600.00",
    price: "700.00",
  },
  {
    why: "a half-zip training tracksuit is R850; the list has no R1000 half-zip",
    match: p => p.type === "Half-Zip Training Set" && ["1000.00", "800.00"].includes(p.price),
    price: "850.00",
  },
  {
    why: "half-zip training top to the R850 half-zip tier",
    match: p => p.type === "Half-Zip Training Top" && p.price === "600.00",
    price: "850.00",
  },
  {
    why: "soccer hoodies and sweatshirts are R850 flat — no long-sleeve surcharge on a sweatshirt",
    match: p => p.type === "Hoodie" && p.price === "950.00",
    price: "850.00",
  },
  {
    why: "fan version is R500",
    match: p => /Fan Version/.test(p.type) && ["450.00", "550.00"].includes(p.price),
    price: "500.00",
  },
  {
    why: "retro is R700",
    match: p => /Retro/.test(p.type) && p.price === "500.00",
    price: "700.00",
  },
];

const changes = [];
for (const p of products) {
  if (isF1(p)) continue;
  const rule = RULES.find(r => r.match(p));
  if (rule) changes.push({ handle: p.handle, title: p.title, type: p.type, from: p.price, to: rule.price, why: rule.why });
}

const byRule = new Map();
for (const c of changes) byRule.set(c.why, (byRule.get(c.why) ?? 0) + 1);

console.log(`${changes.length} product(s) off the 7 Sep price list\n`);
for (const [why, count] of byRule) console.log(`  ${String(count).padStart(3)}  ${why}`);
console.log("");
for (const c of changes) {
  console.log(`R${c.from.padEnd(8)} -> R${c.to.padEnd(8)} ${c.type.padEnd(24)} ${c.title.slice(0, 52)}`);
}

if (!APPLY) {
  console.log("\ndry run — pass --apply to write these prices");
  process.exit(0);
}

const BY_HANDLE = `query($handle:String!){ productByHandle(handle:$handle){ id variants(first:100){ edges{ node{ id price } } } } }`;
const UPDATE = `mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){
  productVariantsBulkUpdate(productId:$productId, variants:$variants){ userErrors{field message} } }`;

let done = 0;
for (const c of changes) {
  const data = await gql(BY_HANDLE, { handle: c.handle });
  const product = data.productByHandle;
  if (!product) { console.log(`MISSING ${c.handle}`); continue; }
  const variants = product.variants.edges.map(e => ({ id: e.node.id, price: c.to }));
  const res = await gql(UPDATE, { productId: product.id, variants });
  const errs = res.productVariantsBulkUpdate.userErrors;
  if (errs.length) throw new Error(`${c.handle}: ${JSON.stringify(errs)}`);
  done++;
}
console.log(`\nrepriced ${done} product(s)`);
