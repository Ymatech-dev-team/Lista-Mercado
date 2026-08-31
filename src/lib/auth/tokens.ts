import { randomBytes, createHash } from "node:crypto";

// Token opaco de alta entropia (256 bits). O valor cru vai no e-mail/cookie;
// no banco guardamos só o sha256 (design.md §4).
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
