"use client";

/**
 * Bonequinho meme da Ju — cabeção (foto real PNG transparente, recorte
 * preciso só do rosto) em cima de um corpinho cartoon SVG.
 * Anima entre 2 frames pra dar sensação de GIF.
 *
 * - mood "feliz": pula com braços pra cima, hearts/sparkles flutuando
 * - mood "triste": curvado, lágrima caindo, body cor mais opaca
 */

type Mood = "feliz" | "triste";
type Size = "sm" | "md" | "lg";

const HEAD_SRC = "/ju/cabeca.png";

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
  const dims = SIZES[size];

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
        <img src={HEAD_SRC} alt="Ju" />
        {/* nuvem de irritação (só triste) */}
        {mood === "triste" && (
          <>
            <span className="ju-rage ju-rage-1" aria-hidden>💢</span>
            <span className="ju-rage ju-rage-2" aria-hidden>😤</span>
          </>
        )}
      </div>

      {/* Dedo do meio — emoji bem grande, acima do braço direito do corpo.
          Universal, sem ambiguidade visual. Anima balançando. */}
      {mood === "triste" && (
        <span className="ju-finger" aria-hidden>
          🖕
        </span>
      )}

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
 * Corpo "puta a vida" — vestido lilás roxo, mão esquerda na cintura,
 * braço direito esticado pra cima. O dedo do meio em si é renderizado
 * como emoji 🖕 sobreposto via HTML (ver JuMascot), pra ficar inequívoco
 * no formato meme. SVG cuida só do corpo + braço.
 */
function BodySad() {
  return (
    <g>
      {/* vestido lilás (atitude) */}
      <path
        d="M 30 10 L 70 10 L 78 70 L 50 75 L 22 70 Z"
        fill="#9D4EDD"
        stroke="#1A1A1A"
        strokeWidth="1.5"
      />
      {/* pernas firmes, abertas (postura de revolta) */}
      <line x1="40" y1="75" x2="38" y2="100" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="75" x2="62" y2="100" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />

      {/* mão esquerda na cintura (estática) */}
      <path d="M 30 18 Q 18 28 22 45 L 32 42" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="42" r="4" fill="#9D4EDD" stroke="#1A1A1A" strokeWidth="1.5" />

      {/* === BRAÇO DIREITO levantado (o punho conecta com o emoji 🖕) === */}

      {/* Frame A — braço inclinado pra esquerda */}
      <g className="ju-frame-a">
        <path d="M 70 18 Q 82 8 84 -2" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Frame B — braço inclinado pra direita */}
      <g className="ju-frame-b">
        <path d="M 70 18 Q 84 8 86 0" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}
