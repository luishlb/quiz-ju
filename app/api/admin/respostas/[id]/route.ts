/**
 * DELETE /api/admin/respostas/[id]
 * Apaga UMA tentativa específica. Auth obrigatória.
 */

import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { apagarResposta } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id ausente" }, { status: 400 });
  }
  try {
    const deleted = await apagarResposta(id);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("[admin/respostas/id] DELETE falhou:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "erro inesperado" },
      { status: 500 },
    );
  }
}
