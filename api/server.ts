// Vercel serverless entry: the tRPC/commerce API only.
// The SPA itself is served as static files from dist/public.
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, shop: process.env.SHOPIFY_STORE_DOMAIN ?? null })
);

export default app;
