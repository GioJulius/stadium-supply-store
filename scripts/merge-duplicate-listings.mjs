/**
 * Merges 17 confirmed duplicate listings, each of which exists twice because
 * the catalogue was imported from two different sources. For every pair the
 * listing with the wider size range survives; before its twin is deleted it
 * inherits:
 *   - the twin's price, which is the owner-approved schedule (fan R450,
 *     player R650, retro R700) rather than the importer's guess
 *   - any photograph the survivor doesn't already hold, appended so the
 *     survivor's lead image is untouched, and never the supplier size chart
 *   - a better title, where the survivor's was worse
 *
 * Deletion is permanent and runs only after the merge is verified.
 *
 * Usage: node scripts/merge-duplicate-listings.mjs [--apply] [--delete]
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
const DELETE = process.argv.includes("--delete");
const PLAN = JSON.parse(readFileSync(new URL("../.dupcheck/final-plan.json", import.meta.url), "utf8"));

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (body.errors?.some(e => e.extensions?.code === "THROTTLED") && attempt < 6) {
      await new Promise(r => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

const VARIANTS = `query ($id: ID!) { product(id: $id) { title variants(first: 20) { edges { node { id price } } } } }`;
const SET_PRICE = `
  mutation ($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors { field message }
    }
  }`;
const SET_TITLE = `mutation ($input: ProductInput!) { productUpdate(input: $input) { userErrors { field message } } }`;
const ADD_MEDIA = `
  mutation ($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      mediaUserErrors { field message }
    }
  }`;
const DELETE_PRODUCT = `mutation ($input: ProductDeleteInput!) { productDelete(input: $input) { deletedProductId userErrors { field message } } }`;

const fail = (label, errs) => { if (errs?.length) throw new Error(`${label}: ${JSON.stringify(errs)}`); };

for (const row of PLAN) {
  const label = row.keep_title;
  if (row.new_price !== row.old_price) {
    console.log(`${APPLY ? "price" : "would price"} ${label}: R${row.old_price} -> R${row.new_price}`);
    if (APPLY) {
      const data = await gql(VARIANTS, { id: row.keep_id });
      const variants = data.product.variants.edges.map(e => ({ id: e.node.id, price: row.new_price }));
      const res = await gql(SET_PRICE, { productId: row.keep_id, variants });
      fail(label, res.productVariantsBulkUpdate.userErrors);
    }
  }
  if (row.retitle) {
    console.log(`${APPLY ? "retitle" : "would retitle"} ${label} -> ${row.retitle}`);
    if (APPLY) {
      const res = await gql(SET_TITLE, { input: { id: row.keep_id, title: row.retitle } });
      fail(label, res.productUpdate.userErrors);
    }
  }
  if (row.add_images.length) {
    console.log(`${APPLY ? "carry over" : "would carry over"} ${row.add_images.length} photo(s) to ${label}`);
    if (APPLY) {
      const media = row.add_images.map(url => ({ originalSource: url, mediaContentType: "IMAGE" }));
      const res = await gql(ADD_MEDIA, { productId: row.keep_id, media });
      fail(label, res.productCreateMedia.mediaUserErrors);
    }
  }
  if (DELETE) {
    console.log(`${APPLY ? "DELETE" : "would DELETE"} ${row.drop_title}`);
    if (APPLY) {
      const res = await gql(DELETE_PRODUCT, { input: { id: row.drop_id } });
      fail(row.drop_title, res.productDelete.userErrors);
    }
  }
}
console.log(APPLY ? "done" : "dry run only — nothing changed");
