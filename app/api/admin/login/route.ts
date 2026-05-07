/**
 * POST /api/admin/login
 * Body: { password: string }
 *
 * Compara contra ADMIN_PASSWORD do env. Em sucesso, seta cookie HttpOnly
 * que vai automático nos próximos requests.
 */

import { NextResponse, type NextRequest } from "next/server";
import { setAdminCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD não configurada no servidor" },
      { status: 500 },
    );
  }

  if (!body.password || body.password !== expected) {
    return NextResponse.json({ error: "Senha errada" }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
