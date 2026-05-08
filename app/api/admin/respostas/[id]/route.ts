/**
 * /api/admin/respostas/[id]
 *
 * DELETE — apaga UMA tentativa
 * PATCH  — atualiza flags da tentativa (oculto: boolean)
 *
 * Auth obrigatória nas duas.
 */

import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { apagarResposta, setOculto } from "@/lib/db";

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

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: { oculto?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (typeof body.oculto !== "boolean") {
    return NextResponse.json(
      { error: "campo 'oculto' (boolean) obrigatório" },
      { status: 400 },
    );
  }
  try {
    const updated = await setOculto(id, body.oculto);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error("[admin/respostas/id] PATCH falhou:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "erro inesperado" },
      { status: 500 },
    );
  }
}
