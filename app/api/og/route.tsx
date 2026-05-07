/**
 * GET /api/og?titulo=...&subtitulo=...&score=...&total=...&manchete=...
 *
 * Lê /public/post-bg.png como base (gerada externamente, layout Capricho
 * Y2K com toda a decoração) e sobrepõe SÓ o texto dinâmico via Satori.
 *
 * Fontes Capricho — Bungee (chunky retro pra título) + Lilita One
 * (bubble bold pra score). Carregadas do Google Fonts no boot do worker
 * via UA antigo (que retorna TTF, formato que o Satori entende).
 *
 * Se as fontes falharem ao carregar, cai no sans-serif default — degrada
 * graciosamente sem quebrar a rota.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// BG renderizado uma vez no boot
const BG_PATH = join(process.cwd(), "public", "post-bg.png");
const BG_DATA_URL = `data:image/png;base64,${readFileSync(BG_PATH).toString("base64")}`;

const ROSA_CHOQUE = "#FF1493";
const LILAS = "#C77DFF";
const PRETO = "#1A1A1A";

const FAMILY_BUNGEE = "Bungee";
const FAMILY_LILITA = "Lilita One";

/**
 * Busca o TTF do Google Fonts. UA antigo (IE9) força a CDN a devolver
 * .ttf em vez de .woff2 (Satori prefere TTF).
 */
async function loadGoogleFontTTF(family: string): Promise<ArrayBuffer> {
  const familyParam = family.replace(/\s+/g, "+");
  const url = `https://fonts.googleapis.com/css2?family=${familyParam}`;
  const cssRes = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)",
    },
  });
  if (!cssRes.ok) throw new Error(`CSS fetch ${cssRes.status} for ${family}`);
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/);
  if (!match) throw new Error(`TTF não encontrado no CSS de ${family}`);
  const ttfRes = await fetch(match[1]);
  if (!ttfRes.ok) throw new Error(`TTF fetch ${ttfRes.status} for ${family}`);
  return ttfRes.arrayBuffer();
}

type FontEntry = {
  name: string;
  data: ArrayBuffer;
  weight: 400;
  style: "normal";
};

let cachedFonts: FontEntry[] | null = null;

async function getFonts(): Promise<FontEntry[]> {
  if (cachedFonts) return cachedFonts;
  try {
    const [bungee, lilita] = await Promise.all([
      loadGoogleFontTTF(FAMILY_BUNGEE),
      loadGoogleFontTTF(FAMILY_LILITA),
    ]);
    cachedFonts = [
      { name: FAMILY_BUNGEE, data: bungee, weight: 400, style: "normal" },
      { name: FAMILY_LILITA, data: lilita, weight: 400, style: "normal" },
    ];
    return cachedFonts;
  } catch (err) {
    console.error("[og] falha ao carregar fontes Google, usando default:", err);
    return [];
  }
}

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

  const fonts = await getFonts();

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
              fontSize: 80,
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
      fonts,
    },
  );
}
