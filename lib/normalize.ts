/**
 * Normaliza string pra comparação flexível de respostas curtas:
 * - lowercase
 * - remove acentos
 * - colapsa espaços duplos
 * - trim
 *
 * Não remove pontuação (ex: vírgula em "1,49" precisa ser tratada
 * caso a caso na lib/scoring com aliases específicos).
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Verifica se a resposta do usuário bate com qualquer um dos aliases
 * (todos comparados após normalize). Use pra perguntas curtas/abertas.
 */
export function matchesAny(input: string, aliases: string[]): boolean {
  const n = normalize(input);
  return aliases.some((a) => normalize(a) === n);
}

/**
 * Verifica se a resposta do usuário CONTÉM alguma palavra-chave
 * (após normalize). Útil pras perguntas de "palavras-chave"
 * (ex: pergunta 16 — mania).
 */
export function matchesKeyword(input: string, keywords: string[]): boolean {
  const n = normalize(input);
  return keywords.some((k) => n.includes(normalize(k)));
}
