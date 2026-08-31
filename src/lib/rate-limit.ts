import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limit via Upstash Redis (REST) — funciona em serverless (design.md §4).
// Em DEV sem chaves: permite (no-op). Em PRODUÇÃO sem chaves: NEGA (fail-closed) —
// força a configuração antes de ir ao ar.
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

/** true = pode prosseguir; false = estourou o limite. */
export async function checkSignupRateLimit(ip: string, email: string): Promise<boolean> {
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[rate-limit] Upstash não configurado em produção — negando por segurança.");
      return false;
    }
    return true; // dev
  }
  const [byIp, byEmail] = await Promise.all([signupByIp!.limit(ip), signupByEmail!.limit(email)]);
  return byIp.success && byEmail.success;
}
