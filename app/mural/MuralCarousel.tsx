"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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

const RANKING_DURATION_MS = 10_000;
const RECADO_DURATION_MS = 12_000;
const REFRESH_DATA_MS = 30_000;

function isLuis(nome: string): boolean {
  const n = nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  return n === "luis" || n === "luiz";
}

/** Pin Luis no #1 (mesmo padrão do admin). */
function pinLuisFirst(ranking: RankingRow[]): RankingRow[] {
  const luisIdx = ranking.findIndex((r) => isLuis(r.nome));
  if (luisIdx < 0) return ranking;
  return [ranking[luisIdx], ...ranking.filter((_, i) => i !== luisIdx)];
}

/** Constrói a sequência de slides: ranking primeiro, depois alterna 1 recado
 *  com 1 ranking pra a galera não esquecer da pontuação. */
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

  // Fetch inicial + auto-refresh
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

  // Avança o slide quando termina
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

  // Evita slideIdx fora do range quando dados mudam
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
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-rosa-pastel via-rosa-bubble to-lilas px-12 text-center gap-6">
        <h1 className="font-bubble text-white text-7xl drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
          MURAL DA JU
        </h1>
        <p className="font-display text-white text-2xl uppercase tracking-widest">
          ainda esperando os recados chegarem 💌
        </p>
        {erro && (
          <p className="font-body text-white/80 text-sm mt-4">⚠️ {erro}</p>
        )}
      </main>
    );
  }

  const slide = sequence[slideIdx % sequence.length];

  return (
    <main className="fixed inset-0 overflow-hidden bg-gradient-to-br from-rosa-pastel via-rosa-bubble to-lilas">
      {/* Faixa header sempre presente */}
      <header className="absolute top-0 left-0 right-0 px-12 pt-8 z-10 flex justify-between items-center">
        <div>
          <h1 className="font-bubble text-white text-5xl drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)] leading-none">
            JU FAZ 40
          </h1>
          <p className="font-display text-white/90 text-sm uppercase tracking-widest mt-1">
            ✨ teste oficial Capricho
          </p>
        </div>
        <p className="font-display text-white/80 text-sm uppercase tracking-widest text-right">
          24 . 04 . 2027
          <br />
          <span className="text-xs">Ilha do Retiro · Recife</span>
        </p>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${slideIdx}-${slide.kind}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center px-16 pt-32 pb-16"
        >
          {slide.kind === "ranking" ? (
            <RankingSlide rows={slide.rows} />
          ) : (
            <RecadoSlide row={slide.row} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Barra de progresso fininha embaixo */}
      <SlideProgressBar
        key={`bar-${slideIdx}`}
        durationMs={
          slide.kind === "ranking" ? RANKING_DURATION_MS : RECADO_DURATION_MS
        }
      />
    </main>
  );
}

function RankingSlide({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-6">
      <h2 className="font-bubble text-white text-7xl drop-shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
        🏆 RANKING
      </h2>
      <div className="bg-white/95 rounded-3xl border-8 border-amarelo-glitter shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8 w-full">
        <table className="w-full">
          <tbody>
            {rows.map((r, i) => {
              const isLuisRow = i === 0 && isLuis(r.nome);
              return (
                <tr
                  key={r.id}
                  className={`${
                    isLuisRow
                      ? "bg-amarelo-glitter/30 border-y-4 border-amarelo-glitter"
                      : i % 2 === 0
                        ? ""
                        : "bg-rosa-pastel/20"
                  }`}
                >
                  <td className="px-3 py-3 font-bubble text-rosa-choque text-3xl w-16 text-center">
                    {isLuisRow ? "👑" : i + 1}
                  </td>
                  <td className="px-3 py-3 font-bubble text-preto-revista text-3xl">
                    {r.nome}
                    {isLuisRow && (
                      <span className="block font-body italic text-sm text-preto-revista/70 normal-case mt-1">
                        o melhor amigo disparado — autor do quiz, é juiz e jogador
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-display text-rosa-choque text-base uppercase tracking-wider hidden md:table-cell">
                    {r.titulo ?? ""}
                  </td>
                  <td className="px-3 py-3 font-bubble text-rosa-choque text-3xl text-right whitespace-nowrap">
                    {r.pontuacao}
                    <span className="text-preto-revista/40 text-xl">
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
  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-6">
      <h2 className="font-bubble text-white text-5xl drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)]">
        💌 recado pra Ju
      </h2>
      <div className="bg-white/95 rounded-3xl border-8 border-rosa-bubble shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-12 w-full text-center">
        <p
          className="font-body text-preto-revista whitespace-pre-wrap leading-tight"
          style={{
            fontSize: row.recado.length > 200 ? "2rem" : "2.75rem",
          }}
        >
          “{row.recado}”
        </p>
        <div className="mt-8 pt-6 border-t-2 border-rosa-pastel flex items-center justify-between gap-4">
          <p className="font-bubble text-rosa-choque text-4xl">— {row.nome}</p>
          {row.titulo && (
            <p className="font-display text-rosa-choque text-base uppercase tracking-widest opacity-70 text-right hidden md:block">
              {row.titulo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Barra de progresso do slide atual — visual feedback do tempo restante. */
function SlideProgressBar({ durationMs }: { durationMs: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
      <motion.div
        className="h-full bg-amarelo-glitter"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: durationMs / 1000, ease: "linear" }}
      />
    </div>
  );
}
