# GoBuy Product Trust MCP Server

A public, read-only MCP server that gives AI agents GoBuy marketplace-evidence scores. One call returns a 0–100 evidence index, observed and missing signals, freshness, and product context.

> Evidence Scores describe available marketplace records, not product quality, safety, value, suitability, seller legitimacy, or a purchase recommendation. Retailers do not endorse GoBuy.

**Public endpoint:** `https://mcp.gobuy.ai/mcp`

Service statistics are available at `https://mcp.gobuy.ai/stats`.

## Tools

- `check_product_trust`: inspect one Amazon, Walmart, Target, or Best Buy listing.
- `compare_products`: inspect and rank 2–20 listings by Evidence Score.

Both tools accept native retailer IDs. Example:

```json
{
  "retailer": "amazon",
  "product_id": "B0BXYCS74H"
}
```

Comparison input:

```json
{
  "products": [
    { "retailer": "amazon", "product_id": "B0BXYCS74H" },
    { "retailer": "walmart", "product_id": "123456789" }
  ]
}
```

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
cp .env.example .env
# Set INTERNAL_API_URL to the GoBuy API origin.
pnpm install
pnpm build
PORT=3000 INTERNAL_API_URL=https://your-gobuy-api.example pnpm start
```

Streamable HTTP is available at `http://localhost:3000/mcp`. `GET /mcp` without an SSE `Accept` header is a health check. Cumulative in-process tool counts are at `GET /stats`.

No client authentication is required in v1. Requests are limited per IP to 60/minute and 1,000/day. Limit responses use HTTP 429 and `Retry-After`.

## Client configuration

### Any MCP Client


```json
{
  "mcpServers": {
    "gobuy-product-trust": {
      "url": "https://mcp.gobuy.ai/mcp"
    }
  }
}
```

### Claude Desktop

Claude Desktop commonly uses a local bridge for remote Streamable HTTP servers:

```json
{
  "mcpServers": {
    "gobuy-product-trust": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.gobuy.ai/mcp"]
    }
  }
}
```



### Generic Streamable HTTP client

Point the client at `https://mcp.gobuy.ai/mcp`; no authorization header is needed.

## Inspector

Run the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Choose **Streamable HTTP**, enter `https://mcp.gobuy.ai/mcp`, connect, list tools, then call `check_product_trust` or `compare_products`.

## Docker

```bash
INTERNAL_API_URL=https://your-gobuy-api.example docker compose up --build
```

The multi-stage image runs as the unprivileged `node` user and includes a `/mcp` healthcheck.

## Operations

Each tool call emits one JSON log line with `timestamp`, `tool`, `latency_ms`, and `status`. `/stats` counters reset when the process restarts.

## License

MIT
