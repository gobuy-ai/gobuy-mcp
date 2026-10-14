# GoBuy Product Trust MCP Server

A public, read-only MCP server that gives AI agents GoBuy marketplace-evidence scores — and the reference evaluator for the **GPV-1 Pre-Purchase Verification Specification**.

Public endpoint: `https://mcp.gobuy.ai/mcp` — keyless, no authentication, read-only. Service statistics: `https://mcp.gobuy.ai/stats`.

## Tools (5)

- **check_product_trust** `{retailer, product_id}` — inspect one Amazon, Walmart, Target, or Best Buy listing: Evidence Score (0-100), verdict, observed/missing signals, freshness. This is the GPV-1 gate evaluator (score >= 55 PASS - 35-54 FLAG - < 35 or not-indexed BLOCK).
- **compare_products** `{products: [...]}` — inspect and rank 2-20 listings by Evidence Score.
- **analyze_reviews** — per-review forensics: review integrity score, adjusted rating, suspicious-review flags, Verified Purchase checks.
- **check_store_score** `{domain}` — GoBuy Store Score for any storefront (Shopify and others): agent-readiness plus trust signals, tiers A-D.
- **scan_store** `{domain}` — on-demand deep storefront scan.

Example:
```json
{ "retailer": "amazon", "product_id": "B0BXYCS74H" }
```

## GPV-1 — Pre-Purchase Verification

This server's `check_product_trust` is the reference evaluator for [GPV-1](https://docs.gobuy.ai/standard), the open pre-purchase verification specification: eight rules (R1-R8) that must all be true before an agent proceeds to checkout. Machine-readable ruleset: [docs.gobuy.ai/standard/v1.json](https://docs.gobuy.ai/standard/v1.json). Reference integration: [verify-then-checkout](https://github.com/digitalmentes7-maker/verify-then-checkout) (Next.js boilerplate - a secured shopping agent in 5 minutes).

## Evidence disclaimer

Evidence Scores describe available marketplace records, not product quality, safety, value, suitability, seller legitimacy, or a purchase recommendation. Retailers do not endorse GoBuy.

## Client configuration

### Any MCP Client
```json
{ "mcpServers": { "gobuy-product-trust": { "url": "https://mcp.gobuy.ai/mcp" } } }
```

### Claude Desktop
```json
{ "mcpServers": { "gobuy-product-trust": { "command": "npx", "args": ["-y", "mcp-remote", "https://mcp.gobuy.ai/mcp"] } } }
```

### Inspector
`npx @modelcontextprotocol/inspector` -> Streamable HTTP -> `https://mcp.gobuy.ai/mcp` -> list tools -> call `check_product_trust`.

## Transports

- **stdio** (for `mcp-proxy` bridges, e.g. Glama deploys): set `MCP_TRANSPORT=stdio`. The server speaks MCP over stdin/stdout; stdout carries only JSON-RPC, all logs go to stderr.
- **HTTP** (default): listens on `PORT` (default 3000), endpoint `/mcp`, health at `GET /mcp`, stats at `GET /stats`.

## Limits

No client authentication required. Rate limited per IP: 60/minute, 1,000/day (429 + Retry-After). Everything is free within rate limits; an optional free API key raises them.

## License

MIT
