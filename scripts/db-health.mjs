// Health-check de conexão com o Neon. Rodar: node --env-file=.env scripts/db-health.mjs
// Confere que o app consegue falar com o banco e enxerga as tabelas.
import { neon } from "@neondatabase/serverless";

async function check(label, url) {
  if (!url) { console.log(`${label} -> (variável vazia)`); return; }
  try {
    const sql = neon(url);
    const rows = await sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`;
    console.log(`${label} -> OK · tabelas em public = ${rows[0].n}`);
  } catch (e) {
    console.log(`${label} -> ERRO: ${e.message}`);
  }
}

await check("POOLED (app)", process.env.DATABASE_URL);
await check("DIRECT (migrations)", process.env.DATABASE_URL_UNPOOLED);
