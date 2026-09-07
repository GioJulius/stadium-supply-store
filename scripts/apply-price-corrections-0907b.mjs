/**
 * Three prices the 7 September list left unsettled, resolved on the evidence
 * of the product photographs.
 *
 *   - The two rugby training vests were R600, a number inherited from the rule
 *     that a vest set costs R600. The 7 Sep list replaced that rule (a vest and
 *     shorts set is R700) and prices no vest on its own, so R600 stopped
 *     standing for anything. Both photographs show a vest alone, no shorts.
 *     Owner's decision, 7 Sep: price them as adult rugby, R700 — the same flat
 *     line as a rugby jersey, which is also what their S-5XL run matches.
 *
 *   - "Liverpool 2025/26 Training Jersey" was R600, which is the LONG SLEEVE
 *     fan price, and the photograph is a short-sleeve pre-match shirt sold on
 *     its own. Ten other standalone pre-match / training shirts in the
 *     catalogue are R500, one of them Liverpool's own Black Check. It is a
 *     leftover from the pre-August import lineage — it still carries that
 *     batch's "Size S-XL" and "Stadium Supply" tags. R500.
 *
 * Named products, not rules: each of the three was identified by eye. Do not
 * generalise this script into a tier — the next vest may come with shorts.
 *
 *   node scripts/apply-price-corrections-0907b.mjs            # dry run
 *   node scripts/apply-price-corrections-0907b.mjs --apply
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

const CORRECTIONS = [
  {
    handle: "ireland-rugby-training-vest",
    from: "600.00", to: "700.00",
    why: "rugby vest sold alone — adult rugby is R700",
  },
  {
    handle: "new-zealand-all-blacks-training-vest",
    from: "600.00", to: "700.00",
    why: "rugby vest sold alone — adult rugby is R700",
  },
  {
    handle: "liverpool-2025-26-training-jersey",
    from: "600.00", to: "500.00",
    why: "short-sleeve pre-match shirt — R600 is the long-sleeve fan price",
  },
];

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

const BY_HANDLE = `query($handle:String!){ productByHandle(handle:$handle){ id title variants(first:100){ edges{ node{ id price } } } } }`;
const UPDATE = `mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){
  productVariantsBulkUpdate(productId:$productId, variants:$variants){ userErrors{field message} } }`;

let written = 0;
for (const c of CORRECTIONS) {
  const product = (await gql(BY_HANDLE, { handle: c.handle })).productByHandle;
  if (!product) { console.log(`MISSING   ${c.handle}`); continue; }

  const prices = [...new Set(product.variants.edges.map(e => e.node.price))];
  console.log(`R${c.from} -> R${c.to}  ${product.title}`);
  console.log(`             ${c.why}`);
  console.log(`             ${product.variants.edges.length} variants, currently at ${prices.map(p => `R${p}`).join(", ")}`);

  // The `from` price is the reason this product is in the list. If it has moved
  // since, someone else has already had an opinion and this script must not
  // overwrite it silently.
  if (prices.length !== 1 || prices[0] !== c.from) {
    console.log(`             SKIPPED — expected every variant at R${c.from}\n`);
    continue;
  }
  if (!APPLY) { console.log(""); continue; }

  const variants = product.variants.edges.map(e => ({ id: e.node.id, price: c.to }));
  const errs = (await gql(UPDATE, { productId: product.id, variants })).productVariantsBulkUpdate.userErrors;
  if (errs.length) throw new Error(`${c.handle}: ${JSON.stringify(errs)}`);
  console.log(`             written\n`);
  written++;
}

console.log(APPLY ? `repriced ${written} product(s)` : "dry run — pass --apply to write these prices");
