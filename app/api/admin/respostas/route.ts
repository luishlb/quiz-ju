/**
 * GET /api/admin/respostas — lista respostas (auth obrigatória).
 * DELETE /api/admin/respostas?confirm=1 — apaga TODAS (proteção via query).
 */

import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  apagarTodasRespostas,
  listarRespostas,
  type RespostaRow,
} from "@/lib/db";

export const runtime = "nodejs";

export type { RespostaRow };

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  try {
    const rows = await listarRespostas();
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[admin/respostas] GET falhou:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "erro inesperado" },
      { status: 500 },
    );
  }
}

/** DELETE — apaga TODAS as tentativas. Tem que passar `?confirm=1`. */
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
  try {
    const deleted = await apagarTodasRespostas();
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("[admin/respostas] DELETE falhou:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "erro inesperado" },
      { status: 500 },
    );
  }
}
