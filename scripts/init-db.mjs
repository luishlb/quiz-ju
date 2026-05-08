// Cria a tabela respostas_ju no Neon. Roda uma vez:
//   node --env-file=.env.local scripts/init-db.mjs

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente no env");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS respostas_ju (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz default now(),
      nome text not null,
      pontuacao int not null,
      total int not null,
      titulo text,
      subtitulo text,
      manchete text,
      manchete_post text,
      respostas jsonb,
      tempo_segundos int,
      user_agent text
    )
  `;
  console.log("✓ tabela respostas_ju criada");

  // Index pra ranking ordenado (pontuacao desc, tempo asc)
  await sql`
    CREATE INDEX IF NOT EXISTS respostas_ju_ranking_idx
    ON respostas_ju (pontuacao DESC, tempo_segundos ASC, created_at ASC)
  `;
  console.log("✓ index de ranking criado");

  // Confirma com count
  const [{ count }] =
    await sql`SELECT count(*) as count FROM respostas_ju`;
  console.log(`✓ linhas atuais: ${count}`);
} finally {
  await sql.end();
}
