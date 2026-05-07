"use client";

import { useEffect, useState } from "react";

/**
 * Bonequinho meme da Ju — cabeção (foto real recortada em círculo)
 * em cima de um corpinho cartoon SVG. Anima entre 2 frames pra dar
 * sensação de GIF.
 *
 * - mood "feliz": pula com braços pra cima, hearts/sparkles flutuando
 * - mood "triste": curvado, lágrima caindo, body cor mais opaca
 *
 * A cabeça é sorteada entre 3 fotos no mount. Mesmo bonequinho com
 * 3 caras possíveis.
 */

type Mood = "feliz" | "triste";
type Size = "sm" | "md" | "lg";

const HEADS: ReadonlyArray<{ src: string }> = [
  { src: "/ju/cabeca-1.png" },
  { src: "/ju/cabeca-2.png" },
  // cabeca-3 (Ju de óculos) é a mais engraçada (fave do Luis)
  { src: "/ju/cabeca-3.png" },
];

/** Distribuição com peso 2x pra cabeca-3 — usuário marcou como mais engraçada */
const WEIGHTED_HEAD_IDX: ReadonlyArray<number> = [0, 1, 2, 2];

const SIZES: Record<Size, { box: number; head: number; body: number }> = {
  sm: { box: 90, head: 56, body: 50 },
  md: { box: 140, head: 86, body: 80 },
  lg: { box: 220, head: 130, body: 130 },
};

export function JuMascot({
  mood = "feliz",
  size = "md",
  className = "",
}: {
  mood?: Mood;
  size?: Size;
  className?: string;
}) {
  const [headIdx, setHeadIdx] = useState<number | null>(null);

  useEffect(() => {
    const pick = WEIGHTED_HEAD_IDX[Math.floor(Math.random() * WEIGHTED_HEAD_IDX.length)];
    setHeadIdx(pick);
  }, []);

  if (headIdx === null) return null; // evita mismatch SSR/CSR

  const dims = SIZES[size];
  const head = HEADS[headIdx];

  return (
    <div
      className={`ju-mascot ${className}`}
      data-mood={mood}
      style={
        {
          width: dims.box,
          height: dims.box * 1.5,
          // CSS custom props consumidas no globals.css pelos keyframes
          ["--head-size" as string]: `${dims.head}px`,
          ["--body-size" as string]: `${dims.body}px`,
        } as React.CSSProperties
      }
    >
      {/* SPARKLES decorativos (só pro mood feliz) */}
      {mood === "feliz" && (
        <>
          <span className="ju-sparkle ju-sparkle-1">💖</span>
          <span className="ju-sparkle ju-sparkle-2">✨</span>
          <span className="ju-sparkle ju-sparkle-3">⭐</span>
        </>
      )}

      {/* CABEÇA (foto real PNG transparente) */}
      <div className="ju-head" style={{ width: dims.head, height: dims.head }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={head.src} alt="Ju" />
        {/* lágrima caindo (só triste) */}
        {mood === "triste" && (
          <span className="ju-tear" aria-hidden>
            💧
          </span>
        )}
      </div>

      {/* CORPO SVG (chibi) */}
      <svg
        className="ju-body"
        width={dims.body}
        height={dims.body}
        viewBox="0 0 100 100"
        overflow="visible"
        aria-hidden
      >
        {mood === "feliz" ? <BodyHappy /> : <BodySad />}
      </svg>
    </div>
  );
}

/**
 * Corpo feliz — vestido rosa, pernas firmes, dois conjuntos de braços
 * que alternam (frame A: pra cima; frame B: pros lados).
 * Animação de troca via CSS no globals.css.
 */
function BodyHappy() {
  return (
    <g>
      {/* vestido */}
      <path
        d="M 30 10 L 70 10 L 80 70 L 50 75 L 20 70 Z"
        fill="#FF1493"
        stroke="#1A1A1A"
        strokeWidth="1.5"
      />
      {/* detalhe cintura */}
      <path d="M 28 40 L 72 40" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
      {/* pernas */}
      <line x1="42" y1="75" x2="40" y2="100" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="75" x2="60" y2="100" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />

      {/* === BRAÇOS — frame A (cima) === */}
      <g className="ju-frame-a">
        <path d="M 30 15 Q 12 0 8 -8" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 70 15 Q 88 0 92 -8" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="8" cy="-8" r="3.5" fill="#FFB6E1" stroke="#1A1A1A" strokeWidth="1" />
        <circle cx="92" cy="-8" r="3.5" fill="#FFB6E1" stroke="#1A1A1A" strokeWidth="1" />
      </g>

      {/* === BRAÇOS — frame B (lados, jumping) === */}
      <g className="ju-frame-b">
        <path d="M 30 15 Q 18 25 12 35" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 70 15 Q 82 25 88 35" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="12" cy="35" r="3.5" fill="#FFB6E1" stroke="#1A1A1A" strokeWidth="1" />
        <circle cx="88" cy="35" r="3.5" fill="#FFB6E1" stroke="#1A1A1A" strokeWidth="1" />
      </g>
    </g>
  );
}

/**
 * Corpo triste — vestido cinza, ombros caídos, braços pendurados.
 * Frame A vs B: variação sutil de altura (sob).
 */
function BodySad() {
  return (
    <g>
      {/* vestido (mais sóbrio) */}
      <path
        d="M 30 10 L 70 10 L 76 70 L 50 75 L 24 70 Z"
        fill="#C77DFF"
        opacity="0.65"
        stroke="#1A1A1A"
        strokeWidth="1.5"
      />
      {/* pernas levemente juntas */}
      <line x1="44" y1="75" x2="44" y2="100" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      <line x1="56" y1="75" x2="56" y2="100" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />

      {/* braços pendurados, levemente pra dentro (frame A — neutro) */}
      <g className="ju-frame-a">
        <path d="M 30 15 Q 22 35 28 55" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 70 15 Q 78 35 72 55" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="28" cy="55" r="3.5" fill="#E0CFE8" stroke="#1A1A1A" strokeWidth="1" />
        <circle cx="72" cy="55" r="3.5" fill="#E0CFE8" stroke="#1A1A1A" strokeWidth="1" />
      </g>
      {/* mesmo braço, micro variação pra simular soluço (frame B) */}
      <g className="ju-frame-b">
        <path d="M 30 15 Q 24 32 30 50" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 70 15 Q 76 32 70 50" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="30" cy="50" r="3.5" fill="#E0CFE8" stroke="#1A1A1A" strokeWidth="1" />
        <circle cx="70" cy="50" r="3.5" fill="#E0CFE8" stroke="#1A1A1A" strokeWidth="1" />
      </g>
    </g>
  );
}
