/**
 * Faixas de pontuação → título + cor/vibe.
 * Ordem decrescente; primeira faixa cuja `min` o score atinge ganha.
 */

export type TitleTier = {
  min: number;
  max: number;
  emoji: string;
  title: string;
  subtitle: string;
  /** classe Tailwind ou nome da cor pra background do badge */
  vibe: string;
};

export const TIERS: TitleTier[] = [
  {
    min: 19, max: 22,
    emoji: "💎",
    title: "BFF Nota 10",
    subtitle: "amiga desde antes do Orkut",
    vibe: "rosa-choque",
  },
  {
    min: 14, max: 18,
    emoji: "💖",
    title: "Amiga de verdade",
    subtitle: "só faltou colar no álbum de figurinhas",
    vibe: "rosa-bubble",
  },
  {
    min: 8, max: 13,
    emoji: "☕",
    title: "Amiga de café da tarde",
    subtitle: "conhece, mas tem lacunas",
    vibe: "lilas",
  },
  {
    min: 3, max: 7,
    emoji: "👋",
    title: "Conhecida da academia",
    subtitle: "bom dia, boa tarde, boa noite",
    vibe: "azul-neon",
  },
  {
    min: 0, max: 2,
    emoji: "🚨",
    title: "Você é o Breno?",
    subtitle: "só ele tem desculpa",
    vibe: "rosa-choque", // vermelho zoeira (usar bg vermelho via inline style se quiser)
  },
];

export function tierForScore(score: number): TitleTier {
  for (const t of TIERS) {
    if (score >= t.min && score <= t.max) return t;
  }
  // fallback impossível por construção, mas TypeScript exige
  return TIERS[TIERS.length - 1];
}
