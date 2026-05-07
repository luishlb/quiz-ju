/**
 * GET /api/admin/respostas
 * Retorna todas as respostas ordenadas por pontuação desc, tempo asc.
 * Protegido por cookie de admin.
 */

import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

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

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 },
    );
  }

  const { data, error } = await sb
    .from("respostas_ju")
    .select("*")
    .order("pontuacao", { ascending: false })
    .order("tempo_segundos", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data as RespostaRow[] });
}

/** DELETE /api/admin/respostas — apaga TODAS as tentativas (limpar tabela).
 *  Tem que passar `?confirm=1` na query string pra evitar acidentes. */
export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  if (searchParams.get("confirm") !== "1") {
    return NextResponse.json(
      { error: "?confirm=1 obrigatório pra limpar tudo" },
      { status: 400 },
    );
  }
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 },
    );
  }
  // Supabase exige um filtro no DELETE. Filtro que sempre bate:
  // created_at >= epoch zero.
  const { error } = await sb
    .from("respostas_ju")
    .delete()
    .gte("created_at", "1970-01-01");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
