/**
 * Corrections from the category audit of 31 Aug 2026, where every storefront
 * product's photograph was reviewed against the category it was filed under.
 *
 * Two listings were rugby jerseys filed as football, with no rugby word in the
 * title or tags. That is why the rugby import's duplicate check missed them and
 * created a second listing for each: the check searched for rugby wording, and
 * these had none. Both old records are also priced on the football tier rather
 * than the client's R700 rugby tier, so the imported records are the ones to
 * keep. Their in-shop photograph is genuinely better provenance than a supplier
 * stock photo, so it is copied onto the survivor before the old listing is
 * hidden — nothing is deleted, and re-tagging brings one back.
 *
 * One listing was still carrying an unidentified importer title. Its photograph
 * is the Arsenal 25/26 home shirt — red with the tonal Gothic 'A', white
 * sleeves — which the catalogue holds only as a long sleeve, so it is a real
 * product that was simply never named. Naming it is also what puts it in the
 * menu, since menu leaves match on title, product type and tags together.
 *
 * The rest are product types that disagreed with the photograph: a tracksuit
 * filed as a jersey, and a kids kit filed as a plain rugby jersey.
 *
 * Idempotent: every step re-reads live state and skips work already done.
 *
 * Usage: node scripts/fix-miscategorised-products.mjs [--apply]
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

/** Rugby jerseys filed as football, each duplicating a product from the rugby import. */
const DUPLICATES = [
  { stale: "chiefs-2026-27-home-jersey", survivor: "chiefs-home-rugby-jersey" },
  { stale: "new-zealand-2024-25-home-jersey-player", survivor: "new-zealand-all-blacks-home-rugby-jersey-white-collar" },
];

/** Field corrections keyed by handle. */
const EDITS = [
  {
    handle: "stadium-supply-fan-jersey-drop-11",
    title: "Arsenal 2025/26 Home Jersey",
    newHandle: "arsenal-2025-26-home-jersey",
    // `Editable Drop` is one of the two tags isCustomerFacingMappedProduct()
    // gates the storefront on, so it is swapped for `Mapped Media` rather than
    // simply dropped — removing it alone takes the product off the shop.
    addTags: ["Arsenal", "Football", "Mapped Media"],
    dropTags: ["Editable Drop"],
    productType: "Football Jersey",
  },
  {
    handle: "manchester-city-2024-25-training-tracksuit",
    productType: "Tracksuit",
    addTags: ["Tracksuit", "Training", "Manchester City"],
    dropTags: ["Fan Version"],
  },
  {
    handle: "south-africa-springboks-kids-rugby-kit",
    productType: "Kids Kit",
    addTags: ["Kids", "Kiddies soccer set"],
  },
];

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

const FIND = `query($h:String!){ productByHandle(handle:$h){ id handle title productType tags media(first:25){edges{node{id ... on MediaImage{ image{url} }}}} } }`;

let moved = 0, hidden = 0, edited = 0, skipped = 0;

for (const { stale, survivor } of DUPLICATES) {
  const a = (await gql(FIND, { h: stale })).productByHandle;
  const b = (await gql(FIND, { h: survivor })).productByHandle;
  if (!a) { console.log(`MISSING  ${stale}`); continue; }
  if (!b) { throw new Error(`survivor ${survivor} not found — refusing to hide ${stale}`); }

  if (a.tags.includes("Mapped Media")) {
    // Carry the shop photograph over before the listing leaves the storefront.
    const url = a.media.edges.map(e => e.node.image?.url).filter(Boolean)[0];
    const already = new Set(b.media.edges.map(e => e.node.image?.url?.split("/").pop()?.split("?")[0]));
    const name = url?.split("/").pop()?.split("?")[0];
    if (url && !already.has(name)) {
      console.log(`PHOTO    ${stale} -> ${survivor}`);
      if (APPLY) {
        const r = await gql(
          `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ mediaUserErrors{field message} } }`,
          { id: b.id, media: [{ originalSource: url, mediaContentType: "IMAGE", alt: `${b.title} — in store` }] },
        );
        const errs = r.productCreateMedia.mediaUserErrors;
        if (errs.length) throw new Error(`${survivor}: ${JSON.stringify(errs)}`);
      }
      moved++;
    }
    console.log(`HIDE     ${stale} — duplicate of ${survivor}`);
    if (APPLY) await gql(`mutation($id:ID!,$tags:[String!]!){ tagsRemove(id:$id, tags:$tags){ userErrors{field message} } }`, { id: a.id, tags: ["Mapped Media"] });
    hidden++;
  } else {
    console.log(`OK       ${stale} — already hidden`);
    skipped++;
  }
}

for (const edit of EDITS) {
  const p = (await gql(FIND, { h: edit.handle })).productByHandle
    ?? (edit.newHandle ? (await gql(FIND, { h: edit.newHandle })).productByHandle : null);
  if (!p) { console.log(`MISSING  ${edit.handle}`); continue; }

  const wantTags = new Set(p.tags);
  (edit.addTags ?? []).forEach(t => wantTags.add(t));
  (edit.dropTags ?? []).forEach(t => wantTags.delete(t));
  const input = { id: p.id };
  const changes = [];
  if (edit.title && p.title !== edit.title) { input.title = edit.title; changes.push(`title="${edit.title}"`); }
  if (edit.newHandle && p.handle !== edit.newHandle) { input.handle = edit.newHandle; changes.push(`handle=${edit.newHandle}`); }
  if (edit.productType && p.productType !== edit.productType) { input.productType = edit.productType; changes.push(`type=${edit.productType}`); }
  const tagsChanged = wantTags.size !== p.tags.length || p.tags.some(t => !wantTags.has(t));
  if (tagsChanged) { input.tags = [...wantTags]; changes.push("tags"); }

  if (!changes.length) { console.log(`OK       ${p.handle} — already correct`); skipped++; continue; }
  console.log(`EDIT     ${p.handle} — ${changes.join(", ")}`);
  if (APPLY) {
    const r = await gql(`mutation($input:ProductInput!){ productUpdate(input:$input){ userErrors{field message} } }`, { input });
    if (r.productUpdate.userErrors.length) throw new Error(`${p.handle}: ${JSON.stringify(r.productUpdate.userErrors)}`);
  }
  edited++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${moved} photos moved, ${hidden} duplicates hidden, ${edited} products corrected, ${skipped} already correct`);
