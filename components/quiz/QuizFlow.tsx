"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "@/data/questions";
import type { AnswersMap } from "@/lib/scoring";
import {
  ensureStart,
  getAnswers,
  getIndex,
  getNome,
  getStart,
  setAnswers as saveAnswers,
  setIndex as saveIndex,
  setTempoFinal,
} from "@/lib/storage";
import { JuMascot } from "@/components/ui/JuMascot";
import { ConfettiBurst } from "./ConfettiBurst";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

export function QuizFlow() {
  const router = useRouter();
  const total = QUESTIONS.length;

  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  /** direção de transição: 1 = avança (vem da direita), -1 = volta */
  const [dir, setDir] = useState(1);

  // Hidratação inicial — recupera estado do localStorage
  useEffect(() => {
    if (!getNome()) {
      router.replace("/");
      return;
    }
    setAnswers(getAnswers());
    const i = getIndex();
    if (i >= 0 && i < total) setIndex(i);
    ensureStart();
    setHydrated(true);
  }, [router, total]);

  // Persiste a cada mudança
  useEffect(() => {
    if (!hydrated) return;
    saveAnswers(answers);
    saveIndex(index);
  }, [answers, index, hydrated]);

  const currentQuestion = QUESTIONS[index];
  const currentValue = answers[currentQuestion.id] ?? "";

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const canAdvance = useMemo(() => {
    const v = (currentValue ?? "").trim();
    if (!v) return false;
    if (currentQuestion.type === "multiple") {
      const i = Number.parseInt(v, 10);
      return !Number.isNaN(i);
    }
    return true;
  }, [currentValue, currentQuestion.type]);

  const advance = () => {
    if (index + 1 >= total) {
      const start = getStart();
      const tempo = start ? Math.round((Date.now() - start) / 1000) : 0;
      setTempoFinal(tempo);
      router.push("/resultado");
      return;
    }
    setDir(1);
    setIndex((i) => i + 1);
  };

  const goNext = () => {
    if (!canAdvance) return;
    advance();
  };

  /** Pular a pergunta atual: avança sem exigir resposta. */
  const goSkip = () => {
    advance();
  };

  const goPrev = () => {
    if (index === 0) return;
    setDir(-1);
    setIndex((i) => i - 1);
  };

  // Suporte a Enter pra avançar (em inputs short / open-short)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && currentQuestion.type !== "open-long") {
        // textarea quebra linha; outros tipos avançam
        if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
        if (canAdvance) {
          e.preventDefault();
          goNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!hydrated) {
    return (
      <main className="flex-1 flex items-center justify-center font-display text-preto-revista/60">
        ...
      </main>
    );
  }

  return (
    <>
      <ProgressBar current={index} total={total} section={currentQuestion.section} />
      <main className="flex-1 flex flex-col px-4 sm:px-5 py-6 max-w-xl mx-auto w-full">
        <div className="relative flex-1 min-h-[400px]">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={currentQuestion.id}
              custom={dir}
              variants={{
                enter: (d: number) => ({
                  x: d * 320,
                  opacity: 0,
                  rotate: d * 6,
                  scale: 0.85,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 220,
                    damping: 22,
                    mass: 0.9,
                  },
                },
                exit: (d: number) => ({
                  x: d * -320,
                  opacity: 0,
                  rotate: d * -6,
                  scale: 0.85,
                  transition: { duration: 0.28, ease: "easeIn" },
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <QuestionCard
                question={currentQuestion}
                value={currentValue}
                onChange={handleAnswer}
              />
            </motion.div>
          </AnimatePresence>
          <ConfettiBurst trigger={index} />
        </div>

        {/* Navegação */}
        <div className="flex justify-between items-center gap-3 mt-6">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="font-display text-sm uppercase tracking-wider px-5 py-3 rounded-full border-2 border-rosa-bubble text-rosa-choque bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            ← Voltar
          </button>
          <motion.button
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
            whileHover={canAdvance ? { scale: 1.08, rotate: -2 } : {}}
            whileTap={canAdvance ? { scale: 0.95 } : {}}
            animate={
              canAdvance
                ? {
                    scale: [1, 1.04, 1],
                    boxShadow: [
                      "4px 4px 0 rgba(0,0,0,0.25)",
                      "4px 4px 0 rgba(0,0,0,0.25), 0 0 24px rgba(255,20,147,0.6)",
                      "4px 4px 0 rgba(0,0,0,0.25)",
                    ],
                  }
                : {}
            }
            transition={
              canAdvance
                ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            className={[
              "font-bubble text-base sm:text-lg tracking-wide px-6 py-3 rounded-full transition-colors",
              canAdvance
                ? "bg-rosa-choque text-white"
                : "bg-rosa-pastel/60 text-preto-revista/40 cursor-not-allowed",
            ].join(" ")}
          >
            {index + 1 >= total ? "VER RESULTADO 💎" : "PRÓXIMA →"}
          </motion.button>
        </div>

        {/* Mascote saltitante centralizado acima do pular */}
        <div className="flex justify-center mt-4">
          <JuMascot mood="feliz" size="sm" />
        </div>

        {/* Pular: discreto, abaixo do mascote */}
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={goSkip}
            className="font-display text-sm uppercase tracking-wider text-rosa-choque/80 hover:text-rosa-choque underline underline-offset-4 decoration-dotted transition-colors"
          >
            não sei essa, pular ↷
          </button>
        </div>

        <p className="text-center mt-3 text-[11px] text-preto-revista/50 font-display tracking-wide">
          suas respostas salvam automaticamente
        </p>
      </main>
    </>
  );
}
