/**
 * DELETE /api/admin/respostas/[id]
 * Apaga UMA tentativa específica. Auth obrigatória.
 */

import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

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
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 },
    );
  }
  const { error } = await sb.from("respostas_ju").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
