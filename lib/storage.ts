/**
 * Wrapper tipado em torno de localStorage pra evitar typos em chaves
 * e centralizar serialização. Todos helpers são client-side (useEffect/handlers);
 * chamar no SSR vai jogar TypeError.
 */

import type { AnswersMap } from "./scoring";

export const STORAGE_KEYS = {
  nome: "quiz-ju:nome",
  answers: "quiz-ju:respostas",
  index: "quiz-ju:indice",
  start: "quiz-ju:inicio",
  tempo: "quiz-ju:tempo",
  test: "quiz-ju:modo-teste",
} as const;

// ── Nome
export function getNome(): string | null {
  return localStorage.getItem(STORAGE_KEYS.nome);
}
export function setNome(v: string): void {
  localStorage.setItem(STORAGE_KEYS.nome, v);
}

// ── Respostas
export function getAnswers(): AnswersMap {
  const raw = localStorage.getItem(STORAGE_KEYS.answers);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
export function setAnswers(a: AnswersMap): void {
  localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(a));
}

// ── Índice da pergunta atual
export function getIndex(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.index);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export function setIndex(i: number): void {
  localStorage.setItem(STORAGE_KEYS.index, String(i));
}

// ── Timestamp de início (epoch ms) — pra desempate no ranking
export function getStart(): number | null {
  const raw = localStorage.getItem(STORAGE_KEYS.start);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
export function ensureStart(): void {
  if (!localStorage.getItem(STORAGE_KEYS.start)) {
    localStorage.setItem(STORAGE_KEYS.start, Date.now().toString());
  }
}

// ── Tempo total decorrido (segundos) — escrito no fim do quiz
export function setTempoFinal(seconds: number): void {
  localStorage.setItem(STORAGE_KEYS.tempo, String(seconds));
}
export function getTempoFinal(): number | null {
  const raw = localStorage.getItem(STORAGE_KEYS.tempo);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** Apaga TODOS os dados do quiz (botão "Refazer teste").
 *  IMPORTANTE: NÃO apaga o flag de modo-teste — ele tem ciclo de vida próprio
 *  (controlado por URL ?test=1/0). */
export function clearAll(): void {
  const keepTest = localStorage.getItem(STORAGE_KEYS.test);
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
  if (keepTest) localStorage.setItem(STORAGE_KEYS.test, keepTest);
}

// ── Modo teste (não persiste no DB)
export function getTestMode(): boolean {
  return localStorage.getItem(STORAGE_KEYS.test) === "1";
}
export function setTestMode(on: boolean): void {
  if (on) localStorage.setItem(STORAGE_KEYS.test, "1");
  else localStorage.removeItem(STORAGE_KEYS.test);
}
