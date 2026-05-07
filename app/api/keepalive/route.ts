/**
 * GET /api/keepalive
 *
 * Roda 1× por semana via Vercel Cron (vercel.json) pra evitar que o
 * Supabase free tier pause o projeto por inatividade (~7 dias sem
 * requests = pausa). Faz uma query trivial pra "tocar" o DB.
 *
 * Festa é em abril/2027 — esse projeto vai ficar idle ~1 ano. Sem o
 * keepalive, o DB pausa toda semana e a gente perde tempo reativando
 * manualmente toda vez que alguém testar.
 */

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
// Não cachear — sempre executa o ping
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { ok: false, reason: "supabase não configurado" },
      { status: 500 },
    );
  }
  // SELECT trivial — só conta linhas, não retorna dados
  const { count, error } = await sb
    .from("respostas_ju")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ok: true,
    rowCount: count ?? 0,
    timestamp: new Date().toISOString(),
  });
}
