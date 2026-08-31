/**
 * Hides listings that have no photograph of the product in them.
 *
 * Reviewing every storefront lead image as a contact sheet turned up six
 * listings from the supplier's "Chinese knot" and jacket-set batches whose
 * entire gallery is detail crops — fabric weave, a collar, an embroidered
 * badge, a hand holding a swing ticket, and the size chart. There is no whole-
 * garment shot to promote, so no reordering can rescue them; a shopper cannot
 * see what they would be buying.
 *
 * Rather than delete, this drops the `Mapped Media` tag, which is what
 * `isCustomerFacingMappedProduct()` gates the storefront on. The product, its
 * variants, its inventory and its history stay exactly as they are, so
 * re-tagging is all it takes to bring one back once the supplier sends a proper
 * photograph.
 *
 * Re-reads live state and skips anything already untagged, so a rerun is a
 * no-op.
 *
 * Usage: node scripts/hide-unphotographed-products.mjs [--apply]
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const TOKEN = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const APPLY = process.argv.includes("--apply");

const HIDE = [
  "2025-26-manchester-united-chinese-knot-kids-kit",
  "2025-26-manchester-united-chinese-knot-long-sleeve-fan-version",
  "2025-26-real-madrid-chinese-knot-kids-kit",
  "2025-26-real-madrid-chinese-knot-long-sleeve-fan-version",
  "2026-27-fc-barcelona-away-kids-kit",
  "2026-world-cup-germany-jacket-set",
];

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (body.errors?.some(e => e.extensions?.code === "THROTTLED") && attempt < 6) {
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

const BY_HANDLE = `query ByHandle($handle: String!) { productByHandle(handle: $handle) { id handle title tags } }`;
const UNTAG = `mutation Untag($id: ID!, $tags: [String!]!) { tagsRemove(id: $id, tags: $tags) { userErrors { field message } } }`;

let hidden = 0, skipped = 0, missing = 0;

for (const handle of HIDE) {
  const product = (await gql(BY_HANDLE, { handle })).productByHandle;
  if (!product) { console.log(`MISSING  ${handle}`); missing++; continue; }
  if (!product.tags.includes("Mapped Media")) { console.log(`OK       ${handle} — already hidden`); skipped++; continue; }
  console.log(`HIDE     ${handle}`);
  if (APPLY) {
    const errs = (await gql(UNTAG, { id: product.id, tags: ["Mapped Media"] })).tagsRemove.userErrors;
    if (errs.length) throw new Error(`${handle}: ${JSON.stringify(errs)}`);
  }
  hidden++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${hidden} hidden, ${skipped} already hidden, ${missing} not found`);
