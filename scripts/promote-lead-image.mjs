/**
 * Promotes a chosen gallery photo to position 0 for products whose storefront
 * card was leading with something that isn't the garment — a hang tag, a
 * fabric close-up, a trouser leg, or a match action shot. Picks were made by
 * eye from each product's own gallery; nothing new is uploaded and nothing is
 * deleted, only reordered.
 *
 * Usage: node scripts/promote-lead-image.mjs [--apply]
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

/** handle -> zero-based index of the photo that should lead the card. */
const PROMOTIONS = JSON.parse(readFileSync(new URL("./lead-image-picks.json", import.meta.url), "utf8"));

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

const BY_HANDLE = `
  query ($handle: String!) {
    productByHandle(handle: $handle) {
      id
      media(first: 25) { edges { node { id ... on MediaImage { image { url } } } } }
    }
  }`;

const REORDER = `
  mutation ($id: ID!, $moves: [MoveInput!]!) {
    productReorderMedia(id: $id, moves: $moves) {
      job { id }
      userErrors { field message }
    }
  }`;

let done = 0;
for (const [handle, wanted] of Object.entries(PROMOTIONS)) {
  const data = await gql(BY_HANDLE, { handle });
  const product = data.productByHandle;
  if (!product) { console.log(`MISSING ${handle}`); continue; }
  const media = product.media.edges.map(e => e.node);
  const target = media[wanted];
  if (!target) { console.log(`SKIP ${handle}: no media at index ${wanted}`); continue; }
  if (wanted === 0) { console.log(`SKIP ${handle}: already leading`); continue; }
  console.log(`${APPLY ? "promote" : "would promote"} ${handle}: image ${wanted} -> lead`);
  if (APPLY) {
    const res = await gql(REORDER, { id: product.id, moves: [{ id: target.id, newPosition: "0" }] });
    const errs = res.productReorderMedia.userErrors;
    if (errs.length) throw new Error(`${handle}: ${JSON.stringify(errs)}`);
  }
  done++;
}
console.log(`${APPLY ? "promoted" : "to promote"}: ${done}`);
