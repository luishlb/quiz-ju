/**
 * Cliente Supabase server-side.
 *
 * Usa a SERVICE KEY (secret) — bypassa Row Level Security, ideal pra
 * inserts server-side (esse arquivo NUNCA roda no client; route handlers
 * Node only). Sem env vars, retorna null e o quiz segue funcionando
 * (apenas pula a persistência).
 *
 * IMPORTANTE: SUPABASE_SERVICE_KEY NUNCA pode ser prefixada com
 * NEXT_PUBLIC_ — Next.js só expõe envs com esse prefixo pro bundle do
 * client. Mantendo o nome sem prefixo, fica server-only.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn(
      "[supabase] SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes — persistência desativada",
    );
    cached = null;
    return cached;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
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
 * Insere o resultado completo de uma tentativa do quiz.
 * Erros são logados mas não propagam — falha de DB não pode quebrar o resultado.
 * Retorna true se persistiu, false se pulou ou falhou.
 */
export async function registrarResultado(r: RegistroQuiz): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from("respostas_ju").insert({
      nome: r.nome,
      pontuacao: r.pontuacao,
      total: r.total,
      titulo: r.titulo,
      subtitulo: r.subtitulo,
      manchete: r.manchete,
      manchete_post: r.manchete_post,
      respostas: r.respostas,
      tempo_segundos: r.tempo_segundos,
      user_agent: r.user_agent,
    });
    if (error) {
      console.error("[supabase] insert falhou:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[supabase] exceção no insert:", err);
    return false;
  }
}
