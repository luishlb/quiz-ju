// Adiciona colunas de moderação na tabela respostas_ju.
// Idempotente: roda quantas vezes quiser.
//   node --env-file=.env.local scripts/add-mural-columns.mjs

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

try {
  await sql`
    ALTER TABLE respostas_ju
      ADD COLUMN IF NOT EXISTS oculto boolean NOT NULL DEFAULT false
  `;
  console.log("✓ coluna oculto");

  await sql`
    ALTER TABLE respostas_ju
      ADD COLUMN IF NOT EXISTS moderacao_status text NOT NULL DEFAULT 'ok'
  `;
  console.log("✓ coluna moderacao_status (ok | bloqueado | revisar)");

  await sql`
    ALTER TABLE respostas_ju
      ADD COLUMN IF NOT EXISTS moderacao_motivo text
  `;
  console.log("✓ coluna moderacao_motivo");

  // Index pro mural filtrar rapido
  await sql`
    CREATE INDEX IF NOT EXISTS respostas_ju_mural_idx
    ON respostas_ju (oculto, moderacao_status)
    WHERE oculto = false AND moderacao_status = 'ok'
  `;
  console.log("✓ index respostas_ju_mural_idx (parcial pros visíveis)");
} finally {
  await sql.end();
}
