/**
 * GET /api/keepalive
 *
 * Originalmente criado pra evitar que o Supabase pause por inatividade.
 * Migramos pra Neon (que não pausa), mas o cron continua existindo como
 * health check + redundância. Custo: 1 query trivial por semana.
 */

import { NextResponse } from "next/server";
import { pingDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pingDb();
    return NextResponse.json({
      ok: result.ok,
      rowCount: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "erro inesperado",
      },
      { status: 500 },
    );
  }
}
