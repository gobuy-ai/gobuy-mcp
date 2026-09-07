import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const servers: ReturnType<typeof createServer>[] = [];
afterEach(() => servers.splice(0).forEach((server) => server.close()));

async function start(app: ReturnType<typeof createApp>) {
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test address");
  return `http://127.0.0.1:${address.port}`;
}

describe("HTTP service", () => {
  it("serves health and cumulative stats", async () => {
    const base = await start(createApp());
    expect((await fetch(`${base}/mcp`)).status).toBe(200);
    expect(await (await fetch(`${base}/stats`)).json()).toMatchObject({ total_calls: 0, errors: 0 });
  });
  it("returns 429 with Retry-After", async () => {
    const base = await start(createApp({ minuteLimit: 1 }));
    await fetch(`${base}/mcp`);
    const blocked = await fetch(`${base}/mcp`);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});