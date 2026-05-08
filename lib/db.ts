/**
 * Cliente Postgres (Neon) — substitui o antigo lib/supabase.ts.
 *
 * Por que Neon e não Supabase: free tier do Supabase só permite 2 projetos
 * ativos por org e PAUSA depois de 1 semana de inatividade. Neon free tem
 * 10 projetos por conta e não pausa (só auto-suspende compute, com cold-start
 * rápido). Ver skill `default-stack` pra contexto completo.
 *
 * DATABASE_URL: connection string do Neon, env-only, sem prefixo NEXT_PUBLIC_.
 * Se ausente, retorna null e a persistência fica desligada (quiz roda sem DB).
 */

import postgres from "postgres";

let cached: ReturnType<typeof postgres> | null | undefined;

/**
 * Retorna o handler tagged-template do `postgres`. Usar pra queries inline:
 *
 *   const sql = getSql();
 *   if (!sql) return; // sem DB
 *   const rows = await sql`SELECT * FROM respostas_ju ORDER BY pontuacao DESC`;
 */
export function getSql(): ReturnType<typeof postgres> | null {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[db] DATABASE_URL ausente — persistência desativada");
    cached = null;
    return cached;
  }
  cached = postgres(url, {
    ssl: "require",
    max: 1, // serverless: pool mínimo
    idle_timeout: 20,
  });
  return cached;
}

export type RegistroQuiz = {
  nome: string;
  pontuacao: number;
  total: number;
  titulo: string;
  subtitulo: string;
  manchete: string;
  manchete_post: string;
  respostas: Record<string, string>;
  tempo_segundos: number | null;
  user_agent: string | null;
};

/**
 * Insere uma tentativa do quiz na tabela respostas_ju.
 * Erros são logados mas NÃO propagam — falha de DB não pode quebrar a /resultado.
 * Retorna true se persistiu, false se pulou ou falhou.
 */
export async function registrarResultado(r: RegistroQuiz): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO respostas_ju (
        nome, pontuacao, total, titulo, subtitulo,
        manchete, manchete_post, respostas, tempo_segundos, user_agent
      ) VALUES (
        ${r.nome}, ${r.pontuacao}, ${r.total}, ${r.titulo}, ${r.subtitulo},
        ${r.manchete}, ${r.manchete_post}, ${sql.json(r.respostas)},
        ${r.tempo_segundos}, ${r.user_agent}
      )
    `;
    return true;
  } catch (err) {
    console.error("[db] insert falhou:", err);
    return false;
  }
}

export type RespostaRow = {
  id: string;
  created_at: string;
  nome: string;
  pontuacao: number;
  total: number;
  titulo: string | null;
  subtitulo: string | null;
  manchete: string | null;
  manchete_post: string | null;
  respostas: Record<string, string> | null;
  tempo_segundos: number | null;
  user_agent: string | null;
};

/** Lista todas as respostas ordenadas por pontuação desc, tempo asc, created asc. */
export async function listarRespostas(): Promise<RespostaRow[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<RespostaRow[]>`
    SELECT id::text, created_at, nome, pontuacao, total,
           titulo, subtitulo, manchete, manchete_post,
           respostas, tempo_segundos, user_agent
    FROM respostas_ju
    ORDER BY pontuacao DESC, tempo_segundos ASC NULLS LAST, created_at ASC
  `;
  return rows;
}

/** Apaga UMA tentativa pelo id. Retorna quantas linhas foram afetadas. */
export async function apagarResposta(id: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const res = await sql`DELETE FROM respostas_ju WHERE id = ${id}`;
  return res.count;
}

/** Apaga TUDO. Retorna quantas linhas foram apagadas. */
export async function apagarTodasRespostas(): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const res = await sql`DELETE FROM respostas_ju`;
  return res.count;
}

/** Ping pro keepalive cron — só roda count, não retorna dados. */
export async function pingDb(): Promise<{ ok: boolean; count: number }> {
  const sql = getSql();
  if (!sql) return { ok: false, count: 0 };
  const [{ count }] =
    await sql<{ count: number }[]>`SELECT count(*)::int as count FROM respostas_ju`;
  return { ok: true, count };
}
