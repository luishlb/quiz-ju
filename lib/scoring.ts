import { matchesAny, matchesKeyword } from "./normalize";
import { QUESTIONS, type Question, type QuestionId } from "@/data/questions";

/**
 * Resposta dada pelo usuário pra uma pergunta:
 * - multiple → string com o índice da opção escolhida
 * - short    → string livre digitada
 * - open-*   → string livre digitada (não pontua)
 */
export type Answer = string;

export type AnswersMap = Partial<Record<QuestionId, Answer>>;

/**
 * Avalia se a resposta dada acertou. Retorna false pra perguntas
 * que não pontuam (open-*) ou pra resposta vazia.
 *
 * Implementação caso a caso por tipo:
 * - multiple: comparar índice numérico
 * - short com aliases: matchesAny
 * - short com keywords: matchesKeyword
 */
export function isCorrect(question: Question, answer: Answer | undefined): boolean {
  if (!answer || !answer.trim()) return false;

  switch (question.type) {
    case "multiple": {
      const idx = Number.parseInt(answer, 10);
      return !Number.isNaN(idx) && idx === question.correctIndex;
    }
    case "short": {
      if (question.aliases?.length) return matchesAny(answer, question.aliases);
      if (question.keywords?.length) return matchesKeyword(answer, question.keywords);
      return false;
    }
    case "open-short":
    case "open-long":
      return false;
  }
}

export type ScoreResult = {
  /** Pontuação 0-22 */
  score: number;
  /** Total possível de pontos (22) */
  total: number;
  /** IDs das perguntas que o usuário ERROU */
  wrongIds: QuestionId[];
};

export function computeScore(answers: AnswersMap): ScoreResult {
  let score = 0;
  const wrongIds: QuestionId[] = [];

  for (const q of QUESTIONS) {
    if (!q.scores) continue;
    if (isCorrect(q, answers[q.id])) {
      score += 1;
    } else {
      wrongIds.push(q.id);
    }
  }

  return { score, total: QUESTIONS.filter((q) => q.scores).length, wrongIds };
}
