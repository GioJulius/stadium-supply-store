/**
 * Adds the `Mapped Media` tag to eight products that were live in Shopify but
 * invisible on the storefront.
 *
 * `isCustomerFacingMappedProduct()` in client/src/lib/catalog.ts gates /shop on
 * a `Mapped Media` or `Editable Drop` tag. These eight are ACTIVE, priced and
 * photographed, but carry neither, so they never reached the grid — a product
 * detail page renders them fine, which is why it never looked like a bug.
 *
 * Six are from the supplier-stock batch, where the other 57 products all got
 * the tag and these did not. The remaining two are older Stadium Supply
 * lineage records.
 *
 * NOT included: `manchester-united-away-26-27`, the one-photo preview product
 * from the very first build, which wants deleting rather than surfacing, and
 * the two Printing Fee products (`name-number-printing`, `competition-badge`),
 * which are cart add-ons and are correctly hidden from the grid.
 *
 * Idempotent: a product that already carries the tag is skipped. Tags are added
 * with tagsAdd, so nothing existing is disturbed.
 *
 * Usage: node scripts/unhide-untagged-products.mjs [--apply]
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");

const HANDLES = [
  "2025-26-manchester-united-chinese-knot-long-sleeve-fan-version",
  "2025-26-real-madrid-chinese-knot-long-sleeve-fan-version",
  "2025-26-real-madrid-chinese-knot-kids-kit",
  "2025-26-manchester-united-chinese-knot-kids-kit",
  "2026-27-fc-barcelona-away-kids-kit",
  "2026-world-cup-germany-jacket-set",
  "chiefs-2026-27-home-jersey",
  "new-zealand-2024-25-home-jersey-player",
];

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (body.errors?.some(e => e.extensions?.code === "THROTTLED") && attempt < 8) {
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

let tagged = 0, skipped = 0, missing = 0;

for (const handle of HANDLES) {
  const product = (await gql(
    `query($h:String!){ productByHandle(handle:$h){ id title status tags images(first:1){edges{node{url}}} } }`,
    { h: handle },
  )).productByHandle;

  if (!product) { console.log(`MISSING ${handle}`); missing++; continue; }
  if (product.tags.includes("Mapped Media") || product.tags.includes("Editable Drop")) {
    console.log(`SKIP    ${handle} — already tagged`);
    skipped++;
    continue;
  }
  // A product with no photograph would reach the grid as an empty tile.
  if (!product.images.edges.length) { console.log(`SKIP    ${handle} — no image, would show an empty card`); skipped++; continue; }
  if (product.status !== "ACTIVE") { console.log(`SKIP    ${handle} — ${product.status}, not active`); skipped++; continue; }

  console.log(`TAG     ${handle.padEnd(62)} ${product.title}`);
  if (!APPLY) { tagged++; continue; }

  const res = await gql(
    `mutation($id:ID!,$tags:[String!]!){ tagsAdd(id:$id, tags:$tags){ userErrors{field message} } }`,
    { id: product.id, tags: ["Mapped Media"] },
  );
  if (res.tagsAdd.userErrors.length) throw new Error(`${handle}: ${JSON.stringify(res.tagsAdd.userErrors)}`);
  tagged++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${tagged} tagged, ${skipped} skipped, ${missing} not found`);
