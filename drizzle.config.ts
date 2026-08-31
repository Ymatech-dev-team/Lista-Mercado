import { defineConfig } from "drizzle-kit";

// DDL do MVP é aplicado manualmente pelo SQL do design.md §6 (o JP roda no Neon).
// Este config existe para introspecção/geração futura. Usa a conexão DIRECT (sem -pooler),
// porque o PgBouncer (pooled) quebra comandos de DDL.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
