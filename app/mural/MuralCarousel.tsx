"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { JuMascot } from "@/components/ui/JuMascot";

type RankingRow = {
  id: string;
  nome: string;
  pontuacao: number;
  total: number;
  titulo: string | null;
  tempo_segundos: number | null;
};

type RecadoRow = {
  id: string;
  nome: string;
  recado: string;
  pontuacao: number;
  titulo: string | null;
};

type Dados = { ranking: RankingRow[]; recados: RecadoRow[] };

type Slide =
  | { kind: "ranking"; rows: RankingRow[] }
  | { kind: "recado"; row: RecadoRow };

const RANKING_DURATION_MS = 12_000;
const RECADO_DURATION_MS = 12_000;
const REFRESH_DATA_MS = 30_000;

function isLuis(nome: string): boolean {
  const n = nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  return n === "luis" || n === "luiz";
}

function pinLuisFirst(ranking: RankingRow[]): RankingRow[] {
  const luisIdx = ranking.findIndex((r) => isLuis(r.nome));
  if (luisIdx < 0) return ranking;
  return [ranking[luisIdx], ...ranking.filter((_, i) => i !== luisIdx)];
}

function buildSequence(dados: Dados): Slide[] {
  const ranking = pinLuisFirst(dados.ranking);
  const slides: Slide[] = [{ kind: "ranking", rows: ranking }];
  for (const recado of dados.recados) {
    slides.push({ kind: "recado", row: recado });
    slides.push({ kind: "ranking", rows: ranking });
  }
  return slides;
}

export function MuralCarousel() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string>("");
  const [slideIdx, setSlideIdx] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await fetch("/api/mural/dados", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Dados;
        setDados(data);
        setErro("");
      } catch (e) {
        console.error("[mural] fetch falhou:", e);
        setErro(e instanceof Error ? e.message : "erro de rede");
      }
    };
    fetchDados();
    refreshTimer.current = setInterval(fetchDados, REFRESH_DATA_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  const sequence = useMemo<Slide[]>(
    () => (dados ? buildSequence(dados) : []),
    [dados],
  );

  useEffect(() => {
    if (sequence.length === 0) return;
    const slide = sequence[slideIdx % sequence.length];
    const duration =
      slide.kind === "ranking" ? RANKING_DURATION_MS : RECADO_DURATION_MS;
    const t = setTimeout(() => {
      setSlideIdx((i) => (i + 1) % sequence.length);
    }, duration);
    return () => clearTimeout(t);
  }, [slideIdx, sequence]);

  useEffect(() => {
    if (sequence.length > 0 && slideIdx >= sequence.length) {
      setSlideIdx(0);
    }
  }, [sequence.length, slideIdx]);

  if (!dados) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-rosa-pastel via-rosa-bubble to-lilas">
        <p className="font-display text-rosa-choque text-3xl uppercase tracking-widest">
          🎀 carregando mural...
        </p>
      </main>
    );
  }

  if (sequence.length === 0) {
    return (
      <CapricoFrame>
        <div className="flex flex-col items-center gap-8 text-center">
          <h2 className="font-bubble text-rosa-choque text-7xl drop-shadow-[4px_4px_0_#fff]">
            esperando os recados 💌
          </h2>
          <p className="font-display text-preto-revista text-2xl uppercase tracking-widest">
            ainda ninguém respondeu o quiz
          </p>
          {erro && (
            <p className="font-body text-preto-revista/60 text-base mt-4">
              ⚠️ {erro}
            </p>
          )}
        </div>
      </CapricoFrame>
    );
  }

  const slide = sequence[slideIdx % sequence.length];

  return (
    <CapricoFrame>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${slideIdx}-${slide.kind}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.03, y: -20 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute inset-0 flex items-start justify-center px-16 pt-32 pb-16"
        >
          {slide.kind === "ranking" ? (
            <RankingSlide rows={slide.rows} />
          ) : (
            <RecadoSlide row={slide.row} />
          )}
        </motion.div>
      </AnimatePresence>

      <SlideProgressBar
        key={`bar-${slideIdx}`}
        durationMs={
          slide.kind === "ranking" ? RANKING_DURATION_MS : RECADO_DURATION_MS
        }
      />
    </CapricoFrame>
  );
}

/**
 * Frame Capricho — gradiente rosa, header gigante, stickers nos cantos,
 * sparkles flutuando, footer com data. É o "moldura" fixa que envolve
 * todos os slides. O conteúdo passa por dentro.
 */
function CapricoFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="fixed inset-0 overflow-hidden bg-gradient-to-br from-rosa-pastel via-rosa-bubble to-lilas">
      {/* Sparkles aleatórios flutuando ao fundo */}
      <FloatingSparkles />

      {/* Stickers fixos nos cantos */}
      <Stickers />

      {/* Header capa Capricho — compacto pra não invadir o slide */}
      <header className="absolute top-0 left-0 right-0 px-10 pt-5 z-20 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <h1
            className="font-bubble text-rosa-choque leading-none"
            style={{
              fontSize: "clamp(40px, 4.5vw, 72px)",
              textShadow:
                "3px 3px 0 #fff, 6px 6px 0 rgba(199,125,255,0.7)",
              letterSpacing: 1.5,
            }}
          >
            JU FAZ 40
          </h1>
          <div className="flex flex-col gap-1">
            <div className="bg-rosa-choque text-white px-3 py-1 rounded-full font-display uppercase tracking-widest text-[11px] shadow-[2px_2px_0_rgba(0,0,0,0.25)] whitespace-nowrap">
              ✨ teste oficial Capricho ✨
            </div>
            <div className="bg-amarelo-glitter text-preto-revista px-2.5 py-0.5 rounded-full font-display uppercase tracking-wider text-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.2)] whitespace-nowrap">
              edição especial · 40 anos
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border-[3px] border-rosa-bubble rounded-xl px-4 py-2 text-right shadow-[3px_3px_0_rgba(0,0,0,0.2)]">
          <p className="font-bubble text-rosa-choque text-lg leading-none">
            24 . 04 . 2027
          </p>
          <p className="font-display text-preto-revista text-[10px] uppercase tracking-widest mt-0.5">
            ilha do retiro · recife
          </p>
        </div>
      </header>

      {/* Conteúdo do slide */}
      {children}

      {/* Mascote Ju "comemorando" no canto inferior esquerdo, discreta pra não invadir o slide */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
        <JuMascot mood="feliz" size="md" />
      </div>

      {/* Footer barrinha com URL */}
      <footer className="absolute bottom-2 left-0 right-0 z-10 text-center">
        <p className="font-display text-white/80 text-xs uppercase tracking-[0.4em]">
          quiz-ju.vercel.app · faça o seu também 💖
        </p>
      </footer>
    </main>
  );
}

/** Stickers laterais — só nas bordas, NÃO no caminho do slide.
 *  Bottom-left livre pra mascote, top livre pro header. */
function Stickers() {
  return (
    <>
      <span className="absolute top-1/3 left-3 text-5xl rotate-[8deg] drop-shadow-[3px_3px_0_rgba(0,0,0,0.2)] z-10 pointer-events-none">
        ⭐
      </span>
      <span className="absolute top-1/3 right-3 text-5xl rotate-[-12deg] drop-shadow-[3px_3px_0_rgba(0,0,0,0.2)] z-10 pointer-events-none">
        💖
      </span>
      <span className="absolute top-2/3 left-3 text-4xl rotate-[-8deg] drop-shadow-[3px_3px_0_rgba(0,0,0,0.2)] z-10 pointer-events-none">
        🎀
      </span>
      <span className="absolute top-2/3 right-3 text-5xl rotate-[8deg] drop-shadow-[3px_3px_0_rgba(0,0,0,0.2)] z-10 pointer-events-none">
        💎
      </span>
      <span className="absolute bottom-12 right-12 text-5xl rotate-[15deg] drop-shadow-[3px_3px_0_rgba(0,0,0,0.2)] z-10 pointer-events-none">
        ✨
      </span>
    </>
  );
}

/** Sparkles aleatórios flutuando ao fundo (decoração contínua). */
function FloatingSparkles() {
  const sparkles = useMemo(() => {
    const emojis = ["✨", "💕", "⭐", "💖", "🌟", "💫"];
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 16 + Math.random() * 24,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 6,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          className="absolute"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: s.size,
            filter: "drop-shadow(0 1px 2px rgba(255,105,180,0.4))",
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {s.emoji}
        </motion.span>
      ))}
    </div>
  );
}

function RankingSlide({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="w-full max-w-[1200px] flex flex-col items-center gap-5">
      <div className="text-center">
        <h2
          className="font-bubble text-white leading-none uppercase"
          style={{
            fontSize: "clamp(28px, 3.6vw, 56px)",
            textShadow: "3px 3px 0 #FF1493, 6px 6px 0 rgba(0,0,0,0.2)",
            letterSpacing: 1,
          }}
        >
          Ranking dos Melhores Amigos da Ju
        </h2>
        <p className="font-display italic text-white/90 text-base mt-2 tracking-wider">
          (depois do Luis, claro 👑)
        </p>
      </div>

      <div className="bg-white/95 rounded-3xl border-[8px] border-amarelo-glitter shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-5 w-full relative">
        {/* Cantinhos da revista */}
        <span className="absolute -top-4 -left-4 text-4xl rotate-[-15deg] drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]">
          ⭐
        </span>
        <span className="absolute -top-4 -right-4 text-4xl rotate-[18deg] drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]">
          💖
        </span>

        <table className="w-full">
          <tbody>
            {rows.map((r, i) => {
              const isLuisRow = i === 0 && isLuis(r.nome);
              return (
                <tr
                  key={r.id}
                  className={`${
                    isLuisRow
                      ? "bg-amarelo-glitter/30 border-y-2 border-amarelo-glitter"
                      : i % 2 === 0
                        ? ""
                        : "bg-rosa-pastel/15"
                  }`}
                >
                  <td className="px-3 py-1.5 font-bubble text-rosa-choque text-2xl w-14 text-center">
                    {isLuisRow ? "👑" : i + 1}
                  </td>
                  <td className="px-3 py-1.5 font-bubble text-preto-revista text-xl">
                    {r.nome}
                    {isLuisRow && (
                      <span className="block font-body italic text-xs text-preto-revista/70 normal-case mt-0">
                        o melhor amigo disparado · autor do quiz
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 font-display text-rosa-choque text-sm uppercase tracking-wider hidden lg:table-cell max-w-xs truncate">
                    {r.titulo ?? ""}
                  </td>
                  <td className="px-3 py-1.5 font-bubble text-rosa-choque text-2xl text-right whitespace-nowrap">
                    {r.pontuacao}
                    <span className="text-preto-revista/40 text-base">
                      /{r.total}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecadoSlide({ row }: { row: RecadoRow }) {
  const recadoLen = row.recado.length;
  const fontSize =
    recadoLen > 280 ? "1.7rem" : recadoLen > 160 ? "2.2rem" : "2.8rem";

  return (
    <div className="w-full max-w-[1100px] flex flex-col items-center gap-5">
      <h2
        className="font-bubble text-white uppercase tracking-wide leading-none"
        style={{
          fontSize: "clamp(28px, 3.4vw, 52px)",
          textShadow: "3px 3px 0 #FF1493, 6px 6px 0 rgba(0,0,0,0.2)",
        }}
      >
        💌 Recado pra Ju
      </h2>

      {/* Polaroid com fita crepe */}
      <div
        className="bg-[#fdf8f0] border-[6px] border-white p-12 rounded-sm shadow-[0_25px_70px_rgba(0,0,0,0.35)] relative w-full max-w-[900px]"
        style={{
          transform: "rotate(-1deg)",
        }}
      >
        {/* fita crepe rosa em cima */}
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 w-32 h-9 bg-rosa-bubble/80 rotate-[-2deg] shadow-[0_3px_6px_rgba(0,0,0,0.2)]" />

        <p
          className="font-body text-preto-revista whitespace-pre-wrap leading-tight text-center"
          style={{ fontSize }}
        >
          “{row.recado}”
        </p>

        <div className="mt-8 pt-6 border-t-2 border-dashed border-rosa-pastel flex items-center justify-between gap-4 flex-wrap">
          <p className="font-bubble text-rosa-choque text-4xl">
            — {row.nome}
          </p>
          {row.titulo && (
            <p className="font-display text-rosa-choque/80 text-base uppercase tracking-widest text-right">
              {row.titulo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideProgressBar({ durationMs }: { durationMs: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30 z-30">
      <motion.div
        className="h-full bg-amarelo-glitter shadow-[0_0_8px_rgba(255,215,0,0.6)]"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: durationMs / 1000, ease: "linear" }}
      />
    </div>
  );
}
