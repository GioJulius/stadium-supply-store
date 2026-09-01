/** Dumps every product with the fields the audit needs. Read-only. */
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
async function gql(query, variables = {}) {
  const r = await fetch(ENDPOINT, { method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
const Q = `query($cursor:String){ products(first:100, after:$cursor){ pageInfo{hasNextPage endCursor}
 edges{ node{ id handle title productType vendor tags status publishedAt
  featuredImage{url}
  images(first:10){edges{node{url}}}
  variants(first:100){edges{node{id title price}}} } } } }`;
let cursor = null, out = [];
do {
  const d = await gql(Q, { cursor });
  out.push(...d.products.edges.map(e => e.node));
  cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
} while (cursor);
const rows = out.map(p => ({
  id: p.id, handle: p.handle, title: p.title, type: p.productType, vendor: p.vendor,
  tags: p.tags, status: p.status, publishedAt: p.publishedAt,
  price: p.variants.edges[0]?.node.price ?? null,
  sizes: p.variants.edges.map(v => v.node.title),
  images: p.images.edges.map(e => e.node.url),
}));
writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
console.log("products:", rows.length);
