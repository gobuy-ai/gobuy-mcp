import { createApp, createMcpServer } from "./app.js";
import { GoBuyApi } from "./api.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Transport selection:
 *  - MCP_TRANSPORT=stdio → speak MCP over stdin/stdout (e.g. Glama's
 *    `mcp-proxy -- tsx dist/index.js` deployment). stdout carries ONLY
 *    JSON-RPC; all operational logs go to stderr.
 *  - default (no env / anything else) → HTTP server on PORT (default 3000),
 *    same behavior as v1.0.0 except logs now go to stderr.
 */
async function main() {
  if (process.env.MCP_TRANSPORT === "stdio") {
    const api = new GoBuyApi(process.env.INTERNAL_API_URL ?? "http://localhost:3000");
    const server = createMcpServer(api, (entry) => process.stderr.write(`${JSON.stringify(entry)}\n`));
    await server.connect(new StdioServerTransport());
    process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), event: "server_started", transport: "stdio" })}\n`);
    return;
  }

  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, "0.0.0.0", () => {
    process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), event: "server_started", transport: "http", port })}\n`);
  });
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), event: "fatal", error: error instanceof Error ? error.message : String(error) })}\n`);
  process.exit(1);
});
