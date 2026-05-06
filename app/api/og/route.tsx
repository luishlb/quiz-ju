/**
 * GET /api/og?nome=...&titulo=...&subtitulo=...&score=...&total=...&emoji=...&manchete=...
 *
 * Gera imagem 1080x1920 (Story IG/WhatsApp) com layout Capricho.
 * Server-side via next/og (Satori) — devolve PNG real, não HTML.
 *
 * Usado pelo botão "Compartilhar" da tela /resultado.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Paleta — espelha globals.css (Satori não suporta CSS variables)
const ROSA_CHOQUE = "#FF1493";
const ROSA_BUBBLE = "#FF69B4";
const ROSA_PASTEL = "#FFB6E1";
const LILAS = "#C77DFF";
const AMARELO = "#FFD700";
const PRETO_REVISTA = "#1A1A1A";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const titulo = (searchParams.get("titulo") ?? "AMIGO DA JU").slice(0, 40);
  const subtitulo = (searchParams.get("subtitulo") ?? "").slice(0, 80);
  const score = searchParams.get("score") ?? "0";
  const total = searchParams.get("total") ?? "22";
  const emoji = searchParams.get("emoji") ?? "💖";
  const manchete = (searchParams.get("manchete") ?? "").slice(0, 280);

  const pct = Math.round(
    (Number.parseInt(score, 10) / Number.parseInt(total, 10)) * 100,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: `linear-gradient(180deg, ${ROSA_PASTEL} 0%, ${ROSA_BUBBLE} 50%, ${LILAS} 100%)`,
          padding: "60px 50px",
          fontFamily: "sans-serif",
          color: PRETO_REVISTA,
        }}
      >
        {/* Header — logo Capricho */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 28,
              color: ROSA_CHOQUE,
              fontWeight: 800,
              letterSpacing: 4,
            }}
          >
            <span>✨</span>
            <span>TESTE OFICIAL CAPRICHO</span>
            <span>✨</span>
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: ROSA_CHOQUE,
              textShadow: `4px 4px 0 #fff, 8px 8px 0 ${LILAS}`,
              letterSpacing: 2,
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            JU FAZ 40
          </div>
          <div
            style={{
              fontSize: 32,
              color: PRETO_REVISTA,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Você é amigo(a) de verdade da Ju?
          </div>
        </div>

        {/* Card central — emoji + título + score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.92)",
            border: `8px solid ${ROSA_BUBBLE}`,
            borderRadius: 40,
            padding: "60px 50px",
            gap: 24,
            boxShadow: `12px 12px 0 ${LILAS}`,
          }}
        >
          <div style={{ fontSize: 200, lineHeight: 1, display: "flex" }}>
            {emoji}
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: ROSA_CHOQUE,
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {titulo}
          </div>
          {subtitulo && (
            <div
              style={{
                fontSize: 32,
                color: `${PRETO_REVISTA}AA`,
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: 1.2,
                marginTop: -8,
              }}
            >
              {subtitulo}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginTop: 12,
            }}
          >
            <span
              style={{
                fontSize: 220,
                fontWeight: 900,
                color: ROSA_CHOQUE,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 80, color: `${PRETO_REVISTA}66` }}>
              /{total}
            </span>
          </div>
          <div
            style={{
              fontSize: 36,
              color: LILAS,
              letterSpacing: 4,
              fontWeight: 700,
              textTransform: "uppercase",
              backgroundColor: `${AMARELO}55`,
              padding: "8px 24px",
              borderRadius: 999,
            }}
          >
            {pct}% de acertos
          </div>
        </div>

        {/* Manchete — primeira pessoa */}
        {manchete && (
          <div
            style={{
              display: "flex",
              backgroundColor: `${AMARELO}55`,
              border: `4px solid ${AMARELO}`,
              borderRadius: 24,
              padding: "32px 40px",
              fontSize: 36,
              lineHeight: 1.35,
              color: PRETO_REVISTA,
              fontStyle: "italic",
            }}
          >
            “{manchete}”
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: PRETO_REVISTA,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 2,
              color: ROSA_CHOQUE,
            }}
          >
            quiz-ju.vercel.app
          </div>
          <div style={{ fontSize: 26, opacity: 0.7 }}>
            24 . 04 . 2027 — Ilha do Retiro, Recife
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    },
  );
}
