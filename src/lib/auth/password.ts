import { hash, verify } from "@node-rs/argon2";

// Parâmetros argon2id — baseline OWASP, seguro para o teto de memória do serverless (design.md §4).
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTS);
}

export function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  return verify(hashStr, plain);
}

// Hash "isca" para gastar o MESMO tempo quando o e-mail não existe no login
// (anti-enumeração por timing, design.md §4). Calculado uma vez e reaproveitado.
let dummyHashPromise: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) dummyHashPromise = hash("timing-dummy-password", OPTS);
  return dummyHashPromise;
}
