/**
 * Deletes the supplier's size-chart image from every product.
 *
 * Supplier galleries arrive as `<batch>_01.jpg … _08.jpg` and `_01` is always
 * the size chart, not the garment. An earlier pass moved it to the end of the
 * gallery so it stopped leading the product cards; the client has now asked for
 * it gone from the products entirely — it is an EZjersey chart, branded for
 * someone else, and the fit advice now lives on the size guide instead.
 *
 * This deletes media, which Shopify cannot undo, so it refuses to strip a
 * product's last image and only ever matches the `_01` filename pattern that
 * `orderGalleryImages()` already treats as a chart. That display-time rule
 * stays in place as a safety net for anything imported later.
 *
 * Idempotent: a product with no chart left is skipped.
 *
 * Usage: node scripts/remove-size-chart-media.mjs [--apply] [--limit N]
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
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;

/** Same rule as `orderGalleryImages()` in the storefront normalisation seam. */
const SIZE_CHART = /\/\d{4,}_0*1\.(?:jpe?g|png|webp)(?:$|\?)/i;

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
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

const PAGE = `query($cursor:String){ products(first:50, after:$cursor){ pageInfo{hasNextPage endCursor}
  edges{ node{ id handle media(first:25){ edges{ node{ id ... on MediaImage{ image{url} } } } } } } } }`;

const products = [];
let cursor = null;
do {
  const page = await gql(PAGE, { cursor });
  products.push(...page.products.edges.map(e => e.node));
  cursor = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
} while (cursor);
console.log(`scanned ${products.length} products`);

let cleaned = 0, removed = 0, skipped = 0, refused = 0;

for (const product of products) {
  if (cleaned >= LIMIT) break;
  const media = product.media.edges.map(e => e.node);
  const charts = media.filter(m => m.image?.url && SIZE_CHART.test(m.image.url));
  if (!charts.length) { skipped++; continue; }
  if (charts.length >= media.length) {
    console.log(`REFUSE   ${product.handle} — every image is a chart, leaving it alone`);
    refused++;
    continue;
  }
  console.log(`REMOVE   ${product.handle} — ${charts.length} chart of ${media.length} images`);
  if (APPLY) {
    const r = await gql(
      `mutation($pid:ID!,$ids:[ID!]!){ productDeleteMedia(productId:$pid, mediaIds:$ids){ mediaUserErrors{field message} } }`,
      { pid: product.id, ids: charts.map(c => c.id) },
    );
    const errs = r.productDeleteMedia.mediaUserErrors;
    if (errs.length) throw new Error(`${product.handle}: ${JSON.stringify(errs)}`);
  }
  cleaned++;
  removed += charts.length;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${removed} charts removed from ${cleaned} products, ${refused} refused, ${skipped} had none`);
