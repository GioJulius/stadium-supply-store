/**
 * Creates the "Name & Number Printing" product that carries the R50
 * personalisation charge.
 *
 * Printing used to be free, so it rode along as cart-line attributes with no
 * money attached. Charging for it needs something Shopify can actually price,
 * and a separate R50 line is the least invasive way to get there: the 98
 * personalisable shirts keep their existing variants, and the fee reaches the
 * hosted checkout and the order as its own line the merchant can see.
 *
 * Inventory is left untracked and the product is published to the same three
 * channels as the shirts, so it behaves exactly like the rest of the catalogue
 * and can never fall out of stock mid-checkout. It is deliberately NOT tagged
 * `Mapped Media`, which is what `isCustomerFacingMappedProduct()` gates /shop
 * on, so it never appears as something to browse.
 *
 * Idempotent: re-running finds the product by handle and only corrects drift.
 *
 * Usage: node scripts/create-printing-fee-product.mjs [--apply]
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

const HANDLE = "name-number-printing";
const PRICE = "50.00";

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

const FIND = `query($h:String!){ productByHandle(handle:$h){ id status variants(first:1){edges{node{id price inventoryItem{tracked}}}} resourcePublicationsV2(first:10){edges{node{publication{id name} isPublished}}} } }`;

async function run() {
  let product = (await gql(FIND, { h: HANDLE })).productByHandle;

  if (!product) {
    console.log(`CREATE   ${HANDLE} @ R${PRICE}`);
    if (!APPLY) {
      console.log("\ndry run: would create the product, price it at R50 and publish it to every channel");
      return;
    }
    const created = await gql(
      `mutation($input:ProductInput!){ productCreate(input:$input){ product{ id variants(first:1){edges{node{id price inventoryItem{tracked}}}} } userErrors{field message} } }`,
      {
        input: {
          title: "Name & Number Printing",
          handle: HANDLE,
          status: "ACTIVE",
          productType: "Service",
          vendor: "Stadium Supply",
          tags: ["Printing Fee"],
          descriptionHtml:
            "<p>Adds your chosen name and squad number to the back of your shirt. Charged once per personalised shirt.</p>",
        },
      },
    );
    if (created.productCreate.userErrors.length) throw new Error(JSON.stringify(created.productCreate.userErrors));
    product = { ...created.productCreate.product, resourcePublicationsV2: { edges: [] } };
  }

  const variant = product.variants.edges[0].node;
  if (variant.price !== PRICE || variant.inventoryItem?.tracked !== false) {
    console.log(`VARIANT  price ${variant.price ?? "-"} -> ${PRICE}; tracked ${variant.inventoryItem?.tracked} -> false`);
    if (APPLY) {
      const r = await gql(
        `mutation($pid:ID!,$vars:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$pid, variants:$vars){ userErrors{field message} } }`,
        { pid: product.id, vars: [{ id: variant.id, price: PRICE, inventoryItem: { tracked: false } }] },
      );
      if (r.productVariantsBulkUpdate.userErrors.length) throw new Error(JSON.stringify(r.productVariantsBulkUpdate.userErrors));
    }
  } else {
    console.log("VARIANT  already correct");
  }

  // Match the shirts' channels, or the Storefront API will not sell the fee.
  const pubs = (await gql(`{ publications(first:20){edges{node{id name}}} }`)).publications.edges.map(e => e.node);
  const live = new Set(
    (product.resourcePublicationsV2?.edges ?? []).filter(e => e.node.isPublished).map(e => e.node.publication.id),
  );
  const missing = pubs.filter(p => !live.has(p.id));
  if (missing.length) {
    console.log(`PUBLISH  ${missing.map(p => p.name).join(", ")}`);
    if (APPLY) {
      const r = await gql(
        `mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{field message} } }`,
        { id: product.id, input: missing.map(p => ({ publicationId: p.id })) },
      );
      if (r.publishablePublish.userErrors.length) throw new Error(JSON.stringify(r.publishablePublish.userErrors));
    }
  } else {
    console.log("PUBLISH  already on every channel");
  }

  console.log(`\n${APPLY ? "applied" : "dry run"} — product ${product.id}, variant ${variant.id}`);
}

await run();
