"use client";

import { useEffect } from "react";
import { setTestMode } from "@/lib/storage";

/**
 * Componente sem UI que lê o query param `?test=1` ou `?test=0` na URL e
 * atualiza o flag de modo-teste no localStorage. Não toca em nada se o
 * param ausente — preserva o estado anterior.
 *
 * Quando o flag está ON, /api/avaliar pula o INSERT no Supabase. Útil pra
 * desenvolver/testar sem encher a tabela de respostas falsas.
 *
 * Uso: simplesmente coloque <TestModeFlag /> em qualquer página onde a
 * pessoa pode acessar com o param. Sugestão: na landing.
 */
export function TestModeFlag() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const test = params.get("test");
    if (test === "1" || test === "true") setTestMode(true);
    else if (test === "0" || test === "false") setTestMode(false);
  }, []);

  return null;
}
