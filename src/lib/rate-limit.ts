import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limit via Upstash Redis (REST) — funciona em serverless (design.md §4).
// Em DEV sem chaves: permite (no-op). Em PRODUÇÃO sem chaves: NEGA (fail-closed).
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

function limiter(prefix: string, max: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  return redis
    ? new Ratelimit({ redis, prefix, limiter: Ratelimit.slidingWindow(max, window), analytics: false })
    : null;
}

const signupByIp = limiter("rl:signup:ip", 10, "10 m");
const signupByEmail = limiter("rl:signup:email", 3, "10 m");
const loginByIp = limiter("rl:login:ip", 20, "10 m");
const loginByEmail = limiter("rl:login:email", 5, "15 m");
const resetByIp = limiter("rl:reset:ip", 10, "15 m");
const resetByEmail = limiter("rl:reset:email", 3, "15 m");

async function checkPair(
  a: Ratelimit | null,
  b: Ratelimit | null,
  keyA: string,
  keyB: string
): Promise<boolean> {
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[rate-limit] Upstash não configurado em produção — negando por segurança.");
      return false;
    }
    return true; // dev
  }
  const [ra, rb] = await Promise.all([a!.limit(keyA), b!.limit(keyB)]);
  return ra.success && rb.success;
}

export const checkSignupRateLimit = (ip: string, email: string) =>
  checkPair(signupByIp, signupByEmail, ip, email);
export const checkLoginRateLimit = (ip: string, email: string) =>
  checkPair(loginByIp, loginByEmail, ip, email);
export const checkResetRateLimit = (ip: string, email: string) =>
  checkPair(resetByIp, resetByEmail, ip, email);
