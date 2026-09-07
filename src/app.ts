import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { GoBuyApi } from "./api.js";
import { createRateLimiter } from "./rate-limit.js";
import { mapScore, rankProducts } from "./trust.js";
import { RETAILERS, type ProductReference } from "./types.js";

const productSchema = z.object({
  retailer: z.enum(RETAILERS).describe("Marketplace containing the listing."),
  product_id: z.string().trim().min(1).max(128).describe("Native retailer product ID, such as an Amazon ASIN."),
});

export function createApp(options: { api?: GoBuyApi; now?: () => number; minuteLimit?: number; dayLimit?: number } = {}) {
  const app = express();
  const api = options.api ?? new GoBuyApi(process.env.INTERNAL_API_URL ?? "http://localhost:3000");
  const stats = { started_at: new Date().toISOString(), total_calls: 0, tools: { check_product_trust: 0, compare_products: 0 }, errors: 0 };
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "64kb" }));
  app.use("/mcp", createRateLimiter(options.now, options.minuteLimit, options.dayLimit));

  function createServer() {
    const server = new McpServer({
      name: "gobuy-product-trust",
      version: "1.0.0",
      description: "Marketplace-evidence trust scores for AI agents — one call returns a 0–100 evidence index with full signal breakdown.",
    });

    server.registerTool("check_product_trust", {
      description: "Return the indexed 0–100 marketplace-evidence score and complete available signal breakdown for one retailer listing.",
      inputSchema: productSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    }, async (input) => {
      const reference: ProductReference = input;
      return runTool("check_product_trust", async () => mapScore(reference, await api.score(reference)));
    });

    server.registerTool("compare_products", {
      description: "Compare 2–20 retailer listings and rank them by marketplace-evidence score. This is not purchase advice.",
      inputSchema: { products: z.array(productSchema).min(2).max(20) },
      annotations: { readOnlyHint: true, openWorldHint: true },
    }, async ({ products }) => runTool("compare_products", async () => ({
      comparison: rankProducts(await Promise.all(products.map(async (ref) => mapScore(ref, await api.score(ref))))),
      ranking_basis: "Descending GoBuy Evidence Score; unindexed products rank last.",
    })));
    return server;
  }

  async function runTool(tool: keyof typeof stats.tools, action: () => Promise<unknown>) {
    const started = Date.now();
    stats.total_calls++;
    stats.tools[tool]++;
    try {
      const value = await action();
      process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), tool, latency_ms: Date.now() - started, status: "ok" })}\n`);
      return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }], structuredContent: value as Record<string, unknown> };
    } catch (error) {
      stats.errors++;
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), tool, latency_ms: Date.now() - started, status: "error", error: message })}\n`);
      return { content: [{ type: "text" as const, text: `GoBuy evidence lookup failed: ${message}` }], isError: true };
    }
  }

  app.get("/stats", (_req, res) => res.json(stats));
  app.get("/mcp", (req, res, next) => {
    if (!req.headers.accept?.includes("text/event-stream")) {
      res.status(200).json({ status: "ok", service: "gobuy-product-trust", transport: "streamable-http", endpoint: "/mcp" });
      return;
    }
    handleMcp(req, res).catch(next);
  });
  app.post("/mcp", (req, res, next) => handleMcp(req, res).catch(next));

  async function handleMcp(req: express.Request, res: express.Response) {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { void transport.close(); void server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  });
  return app;
}