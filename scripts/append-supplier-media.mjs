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
  "inter-milan-2026-27-third-jersey": ["252858738_0.jpg", "252858738_1.jpg", "252858738_2.jpg"],
  "inter-milan-2026-27-third-jersey-player-version": ["252858018_0.jpg", "252858018_1.jpg", "252858018_2.jpg"],
  "liverpool-2026-27-third-kids-kit": ["252859244_0.jpg", "252859244_1.jpg", "252859244_2.jpg"],
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
