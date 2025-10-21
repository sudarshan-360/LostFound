import { RedisOptions } from "bullmq";

export function getRedisConnection(): RedisOptions {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const tls = process.env.REDIS_TLS === "true";
  const opts: RedisOptions = { url } as any;
  if (tls) (opts as any).tls = {};
  return opts;
}