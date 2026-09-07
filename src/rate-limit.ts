import type { NextFunction, Request, Response } from "express";

interface WindowCount { start: number; count: number }
interface ClientCounts { minute: WindowCount; day: WindowCount }

export function createRateLimiter(now: () => number = Date.now, minuteLimit = 60, dayLimit = 1000) {
  const clients = new Map<string, ClientCounts>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const time = now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const counts = clients.get(key) ?? {
      minute: { start: time, count: 0 },
      day: { start: time, count: 0 },
    };
    if (time - counts.minute.start >= 60_000) counts.minute = { start: time, count: 0 };
    if (time - counts.day.start >= 86_400_000) counts.day = { start: time, count: 0 };

    const blocked = counts.minute.count >= minuteLimit ? counts.minute : counts.day.count >= dayLimit ? counts.day : null;
    if (blocked) {
      const duration = blocked === counts.minute ? 60_000 : 86_400_000;
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((blocked.start + duration - time) / 1000))));
      res.status(429).json({ error: "rate_limit_exceeded" });
      return;
    }
    counts.minute.count++;
    counts.day.count++;
    clients.set(key, counts);
    next();
  };
}