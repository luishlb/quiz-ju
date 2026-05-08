/**
 * GET /api/mural/dados
 *
 * Endpoint PÚBLICO (sem auth) consumido pela tela /mural projetada na TV.
 * Retorna o que pode aparecer no telão:
 *   - Top 10 do ranking (ordem real, com Luis pinado pelo front)
 *   - Recados visíveis (não oculto, moderacao=ok, q26 não vazio)
 *
 * Não vaza dados sensíveis: só nome, pontuação, título, recado.
 * Sem manchete/comentários/respostas detalhadas.
 *
 * Cache curto pra mural ficar fluido com novas respostas durante a festa.
 */

import { NextResponse } from "next/server";
import { listarMuralRanking, listarMuralRecados } from "@/lib/db";

export const runtime = "nodejs";
// 30s de cache — novas respostas aparecem dentro de meio minuto
export const revalidate = 30;

export async function GET() {
  try {
    const [ranking, recados] = await Promise.all([
      listarMuralRanking(10),
      listarMuralRecados(),
    ]);
    return NextResponse.json({ ranking, recados });
  } catch (err) {
    console.error("[mural/dados] falhou:", err);
    return NextResponse.json(
      { ranking: [], recados: [], error: err instanceof Error ? err.message : "erro" },
      { status: 500 },
    );
  }
}
