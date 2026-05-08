/**
 * /mural — tela pública pra projetar na TV durante a festa.
 *
 * Carrossel automático que alterna:
 *   1. Top 10 ranking (10s)
 *   2. Cada recado, um por vez (12s cada)
 *   → loop infinito
 *
 * Sem auth (pra projetar não tem teclado fácil), filtra do server só
 * conteúdo seguro (não oculto + moderacao=ok).
 *
 * Auto-refresh a cada 30s pra pegar respostas novas durante a festa.
 */

import { MuralCarousel } from "./MuralCarousel";

// Sempre dinâmico — se o user voltar à tela, pega dados frescos
export const dynamic = "force-dynamic";

export default function MuralPage() {
  return <MuralCarousel />;
}
