/**
 * GET /api/og?titulo=...&subtitulo=...&score=...&total=...&manchete=...
 *
 * Lê /public/post-bg.png como base (gerada externamente, layout Capricho
 * Y2K com toda a decoração) e sobrepõe SÓ o texto dinâmico via Satori.
 *
 * Decisões de robustez:
 *   - runtime nodejs (acesso direto ao filesystem, evita o cold-fetch do edge)
 *   - sem textShadow multi-valor (foi o que quebrou a primeira versão)
 *   - sem emojis renderizados (a base já tem decoração suficiente)
 *   - absolute positioning das camadas de texto
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Lê o BG uma vez no boot do worker e mantém em memória como data URL
const BG_PATH = join(process.cwd(), "public", "post-bg.png");
const BG_DATA_URL = `data:image/png;base64,${readFileSync(BG_PATH).toString("base64")}`;

const ROSA_CHOQUE = "#FF1493";
const LILAS = "#C77DFF";
const PRETO = "#1A1A1A";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const titulo = (searchParams.get("titulo") ?? "AMIGO DA JU").slice(0, 36);
  const subtitulo = (searchParams.get("subtitulo") ?? "").slice(0, 60);
  const score = searchParams.get("score") ?? "0";
  const total = searchParams.get("total") ?? "22";
  const manchete = (searchParams.get("manchete") ?? "").slice(0, 240);

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
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background — layout Capricho gerado externamente */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BG_DATA_URL}
          alt=""
          width={1080}
          height={1920}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Bloco título + subtítulo (parte de cima do card creme) */}
        <div
          style={{
            position: "absolute",
            top: 620,
            left: 100,
            right: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 72,
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
                fontSize: 30,
                color: `${PRETO}AA`,
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: 1.25,
              }}
            >
              {subtitulo}
            </div>
          )}
        </div>

        {/* Score gigante (centro do card creme) */}
        <div
          style={{
            position: "absolute",
            top: 920,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 18,
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: 240,
                fontWeight: 900,
                color: ROSA_CHOQUE,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span
              style={{
                display: "flex",
                fontSize: 80,
                color: `${PRETO}55`,
              }}
            >
              {`/${total}`}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 32,
              color: LILAS,
              letterSpacing: 4,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {`${pct}% de acertos`}
          </div>
        </div>

        {/* Manchete em primeira pessoa (parte de baixo do card creme) */}
        {manchete && (
          <div
            style={{
              position: "absolute",
              top: 1280,
              left: 130,
              right: 130,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 32,
                color: PRETO,
                fontStyle: "italic",
                lineHeight: 1.35,
                textAlign: "center",
              }}
            >
              {`“${manchete}”`}
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    },
  );
}
