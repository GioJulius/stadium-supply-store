/**
 * Appends supplier photographs to products that already exist in Shopify.
 *
 * Three products from the 2 Sep import shipped with client photographs only,
 * because the supplier albums matched to them turned out to be the wrong ones:
 * the gallery crawl paired each album id with the FOLLOWING card's title. The
 * card markup is `<a class="album__main" title="..." href="/albums/ID?uid=1">`
 * — the title precedes the href — so matching href-then-title walked one card
 * ahead. "Inter 26/27 third" resolved to a Newcastle album and "Liverpool third
 * kids" to Marseille, which the eye-check caught before anything was uploaded.
 *
 * Re-crawled with `title="..."\s*href="/albums/(\d+)"` and confirmed each
 * album's own <title> tag, then verified the photographs against the client's
 * by eye as with the rest of the batch.
 *
 * Media is appended, so each product's lead image — the client's own photo —
 * does not move.
 *
 * NOT idempotent in the useful sense: re-running with --apply would append the
 * same photographs a second time. It checks the existing image count first and
 * skips a product that already carries the expected number.
 *
 * Usage: node scripts/append-supplier-media.mjs [--apply]
 */
import { readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");
const SUPPLIER_DIR = "C:/Users/MR GLOBAL/Desktop/GioGlobal/stadium supply media/supplier";

/** handle -> supplier files to append, in order. */
const WORK = {
  // Second pass, 3 Sep: the 25 products that shipped with client photos only.
  // Eleven matched an album by eye; the rest are garments this supplier does
  // not carry, so they keep the client photographs alone.
  "chelsea-2025-26-home-jersey-player-version": ["196970198_1.jpg", "196970198_2.jpg", "196970198_3.jpg"],
  "chelsea-2025-26-home-long-sleeve-jersey": ["203700163_1.jpg", "203700163_2.jpg", "203700163_3.jpg"],
  "chelsea-full-zip-tracksuit-black-blue": ["212969319_1.jpg", "212969319_2.jpg", "212969319_3.jpg"],
  "chelsea-retro-track-jacket-navy": ["215393783_1.jpg", "215393783_2.jpg", "215393783_3.jpg"],
  "chelsea-retro-track-jacket-royal-blue": ["224260083_1.jpg", "224260083_3.jpg", "224260083_4.jpg"],
  "mercedes-amg-petronas-2026-team-shirt-blue": ["252011863_1.jpg", "252011863_2.jpg", "252011863_3.jpg"],
  "inter-milan-2008-09-away-retro-jersey": ["181809523_1.jpg", "181809523_2.jpg", "181809523_3.jpg"],
  "inter-milan-retro-pirelli-crewneck-sweatshirt": ["224260128_1.jpg", "224260128_2.jpg", "224260128_4.jpg"],
  "inter-milan-2002-03-home-retro-jersey": ["165359496_1.jpg", "165359496_2.jpg", "165359496_3.jpg"],
  "inter-milan-1997-98-home-retro-jersey": ["169014272_1.jpg", "169014272_2.jpg", "169014272_3.jpg"],
  "inter-milan-2025-26-half-zip-training-tracksuit-royal-blue": ["235376258_1.jpg", "235376258_2.jpg", "235376258_3.jpg"],
  // NOT included: inter-milan-training-hoodie-black. Album 217376060 is a
  // multi-colourway hoodie listing and its photographs are a swoosh crop, a
  // crest crop and a RED hoodie — the same trap that made this album fail the
  // eye-check on the first pass.
};

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

async function stageAndUpload(path) {
  const filename = basename(path).replace(/[^A-Za-z0-9._-]/g, "_");
  const staged = await gql(
    `mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{name value} } userErrors{field message} } }`,
    { input: [{ resource: "IMAGE", filename, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(statSync(path).size) }] },
  );
  if (staged.stagedUploadsCreate.userErrors.length) throw new Error(JSON.stringify(staged.stagedUploadsCreate.userErrors));
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([readFileSync(path)], { type: "image/jpeg" }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`staged upload failed ${up.status}: ${(await up.text()).slice(0, 300)}`);
  return target.resourceUrl;
}

let appended = 0, skipped = 0;

for (const [handle, files] of Object.entries(WORK)) {
  const product = (await gql(
    `query($h:String!){ productByHandle(handle:$h){ id title images(first:50){edges{node{id}}} } }`,
    { h: handle },
  )).productByHandle;
  if (!product) { console.log(`MISSING ${handle}`); continue; }

  const before = product.images.edges.length;
  if (before >= 4) { console.log(`SKIP    ${handle} — ${before} images already, looks appended`); skipped++; continue; }

  console.log(`APPEND  ${handle.padEnd(52)} ${before} -> ${before + files.length} images`);
  if (!APPLY) { appended++; continue; }

  const media = [];
  for (const f of files) {
    media.push({
      originalSource: await stageAndUpload(join(SUPPLIER_DIR, f)),
      mediaContentType: "IMAGE",
      alt: `${product.title} — supplier view`,
    });
  }
  const res = await gql(
    `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ mediaUserErrors{field message} } }`,
    { id: product.id, media },
  );
  if (res.productCreateMedia.mediaUserErrors.length) throw new Error(`${handle}: ${JSON.stringify(res.productCreateMedia.mediaUserErrors)}`);
  appended++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${appended} products appended, ${skipped} skipped`);
