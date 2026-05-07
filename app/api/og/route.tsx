/**
 * GET /api/og?titulo=...&subtitulo=...&score=...&total=...&manchete=...
 *
 * Lê /public/post-bg.png como base (gerada externamente, layout Capricho
 * Y2K com toda a decoração) e sobrepõe SÓ o texto dinâmico via Satori.
 *
 * Fontes Capricho — Bungee (chunky retro pra título) + Lilita One
 * (bubble bold pra score). Lidas via fs do diretório lib/fonts no boot
 * do worker. Sem fetch externo: zero falha de rede.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Assets carregados uma vez no boot
const ROOT = process.cwd();
const BG_DATA_URL = `data:image/png;base64,${readFileSync(join(ROOT, "public", "post-bg.png")).toString("base64")}`;
const BUNGEE_TTF = readFileSync(join(ROOT, "lib", "fonts", "Bungee-Regular.ttf"));
const LILITA_TTF = readFileSync(join(ROOT, "lib", "fonts", "LilitaOne-Regular.ttf"));

const FONTS = [
  {
    name: "Bungee",
    data: BUNGEE_TTF,
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Lilita One",
    data: LILITA_TTF,
    weight: 400 as const,
    style: "normal" as const,
  },
];

const FAMILY_BUNGEE = "Bungee";
const FAMILY_LILITA = "Lilita One";

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
          fontFamily: FAMILY_LILITA, // default pra textos genéricos (acertos, /total)
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
            left: 60,
            right: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: FAMILY_BUNGEE,
              fontSize: 62,
              color: ROSA_CHOQUE,
              textAlign: "center",
              lineHeight: 1,
              letterSpacing: 0,
              textTransform: "uppercase",
              textShadow: `4px 4px 0 #fff`,
            }}
          >
            {titulo}
          </div>
          {subtitulo && (
            <div
              style={{
                display: "flex",
                fontFamily: FAMILY_LILITA,
                fontSize: 34,
                color: LILAS,
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: 1.2,
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
                fontFamily: FAMILY_LILITA,
                fontSize: 280,
                color: ROSA_CHOQUE,
                lineHeight: 0.85,
                textShadow: `5px 5px 0 #fff`,
              }}
            >
              {score}
            </span>
            <span
              style={{
                display: "flex",
                fontFamily: FAMILY_LILITA,
                fontSize: 90,
                color: `${PRETO}66`,
              }}
            >
              {`/${total}`}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontFamily: FAMILY_BUNGEE,
              fontSize: 30,
              color: LILAS,
              letterSpacing: 3,
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
              left: 110,
              right: 110,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: FAMILY_LILITA,
                fontSize: 36,
                color: PRETO,
                fontStyle: "italic",
                lineHeight: 1.3,
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
      fonts: FONTS,
    },
  );
}
