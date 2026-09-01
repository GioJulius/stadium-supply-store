/**
 * Post-build: gives every route its own HTML shell with real metadata, and
 * writes robots.txt and sitemap.xml.
 *
 * Why this exists rather than a client-side `document.title` hook: the store is
 * shared as a link on WhatsApp, Instagram and TikTok, and none of those
 * scrapers run JavaScript. Before this, every one of those previews showed the
 * same generic card, and Google saw 197 products under one title. Setting the
 * tags from React would fix neither — by the time React runs, the scraper has
 * already read the HTML and left.
 *
 * The output is still the same single-page app: each file is the built
 * index.html with its <head> rewritten, so React boots and takes over exactly
 * as before. Only the bytes a crawler reads before that change.
 *
 * Product pages also carry Product JSON-LD, which is what puts a price and
 * stock state in a Google result rather than a bare blue link.
 *
 * Failure here must NEVER break a deploy: if Shopify is unreachable or the
 * credentials are missing, product pages are skipped with a warning and the
 * static routes, robots.txt and sitemap.xml are still written.
 *
 * Usage: node scripts/prerender-seo.mjs [outDir]   (default dist/public)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";

const OUT = process.argv[2] || "dist/public";
const ORIGIN = "https://stadiumsupply.co.za";
const SHARE_CARD = `${ORIGIN}/media/share-card.jpg`;

// Vercel injects these; locally they come from .env.
let env = { ...process.env };
try {
  const local = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of local.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) continue;
    const k = line.slice(0, line.indexOf("=")).trim();
    if (!env[k]) env[k] = line.slice(line.indexOf("=") + 1).trim();
  }
} catch {
  // No .env on CI is expected; process.env is the source of truth there.
}

const esc = s => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Collapse to one line and clip on a word boundary, the way a preview card does. */
function clip(text, max) {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-–—]$/, "") + "…";
}

const STATIC_ROUTES = [
  { path: "/", title: "Stadium Supply — Football, collected.",
    description: "Football, rugby and F1 kits delivered anywhere in South Africa for a flat R100. Fan, player and retro versions, S to 5XL, with name, number and badge printing.", priority: "1.0" },
  { path: "/shop", title: "Shop all kits",
    description: "Every kit in stock — football, rugby and F1. Fan, player and retro versions from S to 5XL, delivered anywhere in South Africa for R100.", priority: "0.9" },
  { path: "/how-it-works", title: "How it works",
    description: "We order every piece from our supplier once your payment lands. Stock reaches us in 10–15 business days, then ships straight to your door.", priority: "0.7" },
  { path: "/shipping", title: "Shipping & delivery",
    description: "A flat R100 to your door anywhere in South Africa, couriered with The Courier Guy and tracked from collection.", priority: "0.7" },
  { path: "/reviews", title: "Reviews",
    description: "What customers say about their kits, straight from our Instagram reviews highlight.", priority: "0.6" },
  { path: "/contact", title: "Contact us",
    description: "Reach Stadium Supply on WhatsApp, Instagram, TikTok or email — we answer quickly.", priority: "0.6" },
  { path: "/returns", title: "Returns & refunds",
    description: "How returns, faults and cancellations work at Stadium Supply, and what to do if something is not right.", priority: "0.5" },
  { path: "/privacy", title: "Privacy policy",
    description: "What personal information Stadium Supply collects, why we collect it, and how it is handled.", priority: "0.4" },
  { path: "/terms", title: "Terms of service",
    description: "The terms you agree to when you place an order with Stadium Supply.", priority: "0.4" },
];

function head({ title, description, url, image, type = "website", jsonLd }) {
  const t = esc(title);
  const d = esc(clip(description, 165));
  return `    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta name="theme-color" content="#12192c" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="Stadium Supply" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:locale" content="en_ZA" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${esc(image)}" />${
    jsonLd ? `\n    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}`;
}

const shellPath = join(OUT, "index.html");
if (!existsSync(shellPath)) {
  console.error(`prerender-seo: no build at ${shellPath}; run the client build first`);
  process.exit(1);
}
const shell = readFileSync(shellPath, "utf8");

/**
 * Replace everything between <head> and </head> that we own, keeping the
 * charset, viewport and the build's own script/style tags untouched.
 */
function render(meta) {
  const managed = /(\s*<title>[\s\S]*?<\/title>|\s*<meta\s+(?:name|property)="(?:description|theme-color|og:[^"]+|twitter:[^"]+)"[^>]*>|\s*<link\s+rel="canonical"[^>]*>|\s*<!--[\s\S]*?-->)/g;
  return shell.replace(/<head>([\s\S]*?)<\/head>/, (_, inner) =>
    `<head>${inner.replace(managed, "")}\n${head(meta)}\n  </head>`);
}

function writeRoute(routePath, html) {
  // Both spellings, because which one a static host resolves for an extensionless
  // path differs, and a wrong guess would silently serve the generic shell.
  const targets = routePath === "/"
    ? [join(OUT, "index.html")]
    : [join(OUT, `${routePath.slice(1)}.html`), join(OUT, routePath.slice(1), "index.html")];
  for (const t of targets) {
    mkdirSync(dirname(t), { recursive: true });
    writeFileSync(t, html);
  }
}

const urls = [];

for (const route of STATIC_ROUTES) {
  const url = route.path === "/" ? `${ORIGIN}/` : `${ORIGIN}${route.path}`;
  writeRoute(route.path, render({ title: route.path === "/" ? route.title : `${route.title} | Stadium Supply`, description: route.description, url, image: SHARE_CARD }));
  urls.push({ loc: url, priority: route.priority });
}
console.log(`prerender-seo: ${STATIC_ROUTES.length} static routes`);

// ---- Product pages ---------------------------------------------------------

let products = [];
const domain = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
if (!domain || !token) {
  console.warn("prerender-seo: no Shopify credentials — skipping product pages");
} else {
  try {
    const Q = `query($c:String){products(first:100,after:$c){pageInfo{hasNextPage endCursor}edges{node{
      handle title description productType tags status updatedAt
      featuredImage{url}
      variants(first:1){edges{node{price availableForSale}}} }}}}`;
    let cursor = null;
    do {
      const r = await fetch(`https://${domain}/admin/api/2025-04/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query: Q, variables: { c: cursor } }),
      });
      const j = await r.json();
      if (j.errors) throw new Error(JSON.stringify(j.errors));
      products.push(...j.data.products.edges.map(e => e.node));
      cursor = j.data.products.pageInfo.hasNextPage ? j.data.products.pageInfo.endCursor : null;
    } while (cursor);
  } catch (err) {
    console.warn(`prerender-seo: product fetch failed (${err.message}) — skipping product pages`);
    products = [];
  }
}

// The same visibility gate the storefront applies, so prerendered pages and the
// shop grid never disagree about what exists.
const live = products.filter(
  p => p.status === "ACTIVE"
    && (p.tags.includes("Mapped Media") || p.tags.includes("Editable Drop"))
    && p.productType !== "Service");

for (const p of live) {
  const url = `${ORIGIN}/product/${p.handle}`;
  const price = p.variants.edges[0]?.node.price;
  const image = p.featuredImage?.url || SHARE_CARD;
  writeRoute(`/product/${p.handle}`, render({
    title: `${p.title} | Stadium Supply`,
    description: p.description || `${p.title} from Stadium Supply, delivered anywhere in South Africa for a flat R100.`,
    url, image, type: "product",
    jsonLd: {
      "@context": "https://schema.org", "@type": "Product",
      name: p.title, image: [image],
      description: clip(p.description || p.title, 400),
      category: p.productType || undefined,
      brand: { "@type": "Brand", name: "Stadium Supply" },
      offers: {
        "@type": "Offer", url, priceCurrency: "ZAR", price: String(price ?? ""),
        availability: p.variants.edges[0]?.node.availableForSale
          ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    },
  }));
  urls.push({ loc: url, priority: "0.8", lastmod: p.updatedAt?.slice(0, 10) });
}
console.log(`prerender-seo: ${live.length} product pages`);

// ---- robots.txt + sitemap.xml ----------------------------------------------

// These were returning 200 with the SPA's HTML body, which is worse than a 404:
// a crawler asking for a sitemap was being handed a web page.
writeFileSync(join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /404\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

writeFileSync(join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${
      u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.priority}</priority></url>`).join("\n")
  }\n</urlset>\n`);

console.log(`prerender-seo: sitemap with ${urls.length} urls, robots.txt written`);

// The previous host's debug collector lives in client/public so local dev can
// load it, which means every build copies it into the deploy. It is dead weight
// on a customer-facing domain - the production HTML never references it - so it
// comes back out here rather than by breaking the dev tooling that wants it.
const strays = ["__manus__"];
for (const stray of strays) {
  const target = join(OUT, stray);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`prerender-seo: removed stray /${stray} from the build`);
  }
}
