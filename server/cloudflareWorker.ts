// Cloudflare Worker entry: the tRPC commerce API only.
// Everything else is served from dist/public by Workers static assets; see wrangler.jsonc.
//
// The router is built here rather than imported from ./routers because that one
// pulls in the unused Manus auth stack (mysql2, axios, oauth), none of which the
// shop calls. Only `auth.me` is kept, answering null, because useAuth.ts asks for it.
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { publicProcedure, router } from "./_core/trpc";
import { commerceRouter } from "./routers/commerce";
import { fetchProductPageRaw } from "./_core/shopify";

const workerRouter = router({
  commerce: commerceRouter,
  auth: router({ me: publicProcedure.query(() => null) }),
});

/** Read-only catalogue queries safe to share between shoppers. Carts never qualify. */
const CACHEABLE = /^commerce\.(products|collections)\.(list|byHandle)$/;
const CACHE_SECONDS = 300;

function isCacheable(request: Request, url: URL) {
  if (request.method !== "GET") return false;
  const paths = url.pathname.replace("/api/trpc/", "").split(",");
  return paths.every(p => CACHEABLE.test(p));
}

type Ctx = { waitUntil(p: Promise<unknown>): void };

export default {
  async fetch(request: Request, env: Record<string, string>, ctx: Ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, shop: env.SHOPIFY_STORE_DOMAIN ?? null });
    }
    const cache = (caches as unknown as { default: Cache }).default;

    // Raw catalogue pages for the browser to assemble; see fetchProductPageRaw.
    if (url.pathname === "/api/catalog-page" && request.method === "GET") {
      const hit = await cache.match(request);
      if (hit) return hit;
      const page = await fetchProductPageRaw(url.searchParams.get("after"));
      if (!page.ok) return page;
      const shared = new Response(page.body, page);
      shared.headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
      ctx.waitUntil(cache.put(request, shared.clone()));
      return shared;
    }

    if (!url.pathname.startsWith("/api/trpc")) {
      return new Response("Not found", { status: 404 });
    }

    const cacheable = isCacheable(request, url);
    if (cacheable) {
      const hit = await cache.match(request);
      if (hit) return hit;
    }

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: workerRouter,
      createContext: () => ({ req: null, res: null, user: null }) as never,
    });

    if (cacheable && response.ok) {
      const shared = new Response(response.body, response);
      shared.headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
      ctx.waitUntil(cache.put(request, shared.clone()));
      return shared;
    }
    return response;
  },
};
