// src/lib/quota.ts
import { Redis } from "@upstash/redis";

const CAP = Number(process.env.MONTHLY_CAP_GLOBAL || 1000);

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

const canUseRedis =
  !!redisUrl &&
  /^https:\/\//i.test(redisUrl) &&         // 必须是 https
  !!redisToken &&
  !/your_upstash/i.test(redisUrl);         // 防止占位符

export const redis = canUseRedis
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null;

if (!redis) {
  console.warn(
    "[quota] Upstash Redis 未启用，使用内存计数（仅单实例可用）。" +
      (redisUrl ? ` (当前UPSTASH_REDIS_REST_URL="${redisUrl}")` : "")
  );
}

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `quota:global:${y}${m}`;
}

export async function incMonthlyGlobal(inc = 1) {
  const key = monthKey();
  if (redis) {
    const used = await redis.incrby(key, inc);
    if (used === inc) await redis.expire(key, 60 * 60 * 24 * 40);
    return { ok: used <= CAP, used, cap: CAP, remaining: Math.max(0, CAP - used) };
  }
  // 内存兜底 —— 仅本地/单实例
  const g: any = globalThis as any;
  g.__quotaMem ??= new Map<string, number>();
  const mem: Map<string, number> = g.__quotaMem;
  const used = (mem.get(key) ?? 0) + inc;
  mem.set(key, used);
  return { ok: used <= CAP, used, cap: CAP, remaining: Math.max(0, CAP - used) };
}

export async function getMonthlyUsage() {
  const key = monthKey();
  if (redis) {
    const used = (await redis.get<number>(key)) ?? 0;
    return { used, cap: CAP, remaining: Math.max(0, CAP - used) };
  }
  const g: any = globalThis as any;
  const mem: Map<string, number> = g.__quotaMem ?? new Map();
  const used = mem.get(key) ?? 0;
  return { used, cap: CAP, remaining: Math.max(0, CAP - used) };
}
