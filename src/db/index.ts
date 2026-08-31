// Cliente do banco — Neon via driver HTTP (stateless, casa com serverless da Vercel).
// Regra (design.md §1): app usa a connection string POOLED (com -pooler).
// Migrations/drizzle-kit usam a DIRECT (DATABASE_URL_UNPOOLED) — ver drizzle.config.ts.

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Copie de .env.example para .env.local e preencha.");
}

export const db = drizzle(neon(connectionString), { schema });
export { schema };
