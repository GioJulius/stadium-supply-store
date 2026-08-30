/**
 * Moves the supplier size chart (`<batch>_01.jpg`) to the end of each product's
 * media order in Shopify, so the admin and every sales channel agree with the
 * storefront's `orderGalleryImages()` rule.
 *
 * Usage: node scripts/reorder-size-chart-media.mjs [--apply]
 * Without --apply it only reports what it would change.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const DOMAIN = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const ENDPOINT = `https://${DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");
const SIZE_CHART = /\/\d{4,}_0*1\.(?:jpe?g|png|webp)(?:$|\?)/i;

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    const throttled = body.errors?.some(e => e.extensions?.code === "THROTTLED");
    if (throttled && attempt < 5) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

const PRODUCTS = `
  query Products($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage }
      edges {
        cursor
        node {
          id handle
          media(first: 25) {
            edges { node { id ... on MediaImage { image { url } } } }
          }
        }
      }
    }
  }`;

const REORDER = `
  mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
    productReorderMedia(id: $id, moves: $moves) {
      job { id }
      userErrors { field message }
    }
  }`;

const products = [];
let cursor = null;
for (;;) {
  const data = await gql(PRODUCTS, { cursor });
  products.push(...data.products.edges.map(e => e.node));
  if (!data.products.pageInfo.hasNextPage) break;
  cursor = data.products.edges.at(-1).cursor;
}
console.log(`fetched ${products.length} products`);

let changed = 0;
let skipped = 0;
for (const p of products) {
  const media = p.media.edges.map(e => e.node);
  if (media.length < 2) continue;
  const charts = media.filter(m => m.image?.url && SIZE_CHART.test(m.image.url));
  if (charts.length === 0 || charts.length === media.length) continue;
  const tail = media.slice(-charts.length);
  if (charts.every(c => tail.some(t => t.id === c.id))) {
    skipped++;
    continue; // already at the end
  }
  const moves = charts.map((c, i) => ({
    id: c.id,
    newPosition: String(media.length - charts.length + i),
  }));
  console.log(`${APPLY ? "reorder" : "would reorder"} ${p.handle} (${media.length} media)`);
  if (APPLY) {
    const res = await gql(REORDER, { id: p.id, moves });
    const errs = res.productReorderMedia.userErrors;
    if (errs.length) throw new Error(`${p.handle}: ${JSON.stringify(errs)}`);
  }
  changed++;
}
console.log(`${APPLY ? "reordered" : "to reorder"}: ${changed}; already correct: ${skipped}`);
