import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, "0.0.0.0", () => {
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), event: "server_started", port })}\n`);
});