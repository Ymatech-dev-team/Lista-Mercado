import { cookies } from "next/headers";
import { generateToken, hashToken } from "./tokens";
import {
  insertSession,
  findValidSession,
  slideSession,
  deleteSessionByHash,
} from "@/db/sessions";

const SLIDING_MS = 7 * 24 * 60 * 60 * 1000; // renova por 7 dias a cada uso
const ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000; // teto rígido: 30 dias

const isProd = process.env.NODE_ENV === "production";
// __Host- exige Secure (HTTPS). Em dev (http://localhost) usamos nome simples sem Secure.
const COOKIE = isProd ? "__Host-session" : "session";

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

// Cria uma sessão NOVA (rotação no login = anti-fixation) e seta o cookie.
export async function createSession(userId: string) {
  const token = generateToken();
  const now = Date.now();
  await insertSession(
    userId,
    hashToken(token),
    new Date(now + SLIDING_MS),
    new Date(now + ABSOLUTE_MS)
  );
  const c = await cookies();
  // maxAge = teto absoluto (30d); a validade real desliza no banco (7d de inatividade).
  c.set(COOKIE, token, cookieOptions(Math.floor(ABSOLUTE_MS / 1000)));
}

export async function getSessionUserId(): Promise<string | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const row = await findValidSession(tokenHash);
  if (!row) return null;

  // Desliza a validade só quando falta < 1 dia (evita escrever no banco a cada request),
  // sempre respeitando o teto absoluto.
  const now = Date.now();
  if (row.expiresAt.getTime() - now < 24 * 60 * 60 * 1000) {
    const next = new Date(Math.min(now + SLIDING_MS, row.absoluteExpiresAt.getTime()));
    await slideSession(tokenHash, next);
  }
  return row.userId;
}

export async function destroySession() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (token) await deleteSessionByHash(hashToken(token));
  c.delete(COOKIE);
}
