/**
 * Wrapper sobre @google/genai pra avaliar o quiz da Ju.
 *
 * Duas funções principais:
 *   1. validateShorts: valida respostas curtas que NÃO bateram com aliases/keywords locais
 *      (ex: usuário digitou "colégio atual mesmo" — IA decide se é equivalente a "Atual")
 *   2. gerarManchete: gera 1-2 frases personalizadas estilo Capricho com base
 *      no nome, score e respostas abertas.
 *
 * Roda SEMPRE server-side (process.env.GEMINI_API_KEY não pode vazar pro client).
 */

import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
  return new GoogleGenAI({ apiKey });
}

export type ShortValidationItem = {
  id: string;
  pergunta: string;
  gabarito: string;
  resposta: string;
};

export type ShortValidationResult = {
  id: string;
  correto: boolean;
};

/**
 * Pra cada short pendente, pergunta ao Gemini se a resposta é equivalente ao gabarito.
 * Retorna um array com {id, correto} pra cada item.
 */
export async function validateShorts(
  items: ShortValidationItem[],
): Promise<ShortValidationResult[]> {
  if (items.length === 0) return [];

  const ai = getClient();
  const prompt = `
Você é um juiz de quiz. Pra cada pergunta abaixo, decida se a RESPOSTA do usuário
é equivalente ao GABARITO esperado, mesmo que com palavras diferentes, erros de
digitação leves, sinônimos, ou frases mais longas que contêm a resposta certa.

Responda APENAS com JSON: array de {"id": "...", "correto": true/false}.

Exemplos:
- Gabarito "Atual" / Resposta "colégio atual" → correto: true
- Gabarito "Atual" / Resposta "academia" → correto: false
- Gabarito "Sultão" / Resposta "sultao" → correto: true
- Gabarito "Chocolate" / Resposta "doces" → correto: false (muito amplo)

Itens a avaliar:
${JSON.stringify(items, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            correto: { type: Type.BOOLEAN },
          },
          required: ["id", "correto"],
        },
      },
    },
  });

  const txt = response.text ?? "[]";
  try {
    return JSON.parse(txt) as ShortValidationResult[];
  } catch {
    return items.map((i) => ({ id: i.id, correto: false }));
  }
}

export type MancheteInput = {
  nome: string;
  score: number;
  total: number;
  tier: string;
  palavraUnica?: string;
  fraseCompletar?: string;
  musicaJu?: string;
  recado?: string;
};

/**
 * Gera 1-2 frases personalizadas estilo Capricho.
 * Usado na tela /resultado pra dar um toque único pra cada pessoa.
 */
export async function gerarManchete(input: MancheteInput): Promise<string> {
  const ai = getClient();

  const prompt = `
Você é um redator da revista Capricho dos anos 2000. Tom: jovem, debochado,
emoji eventual, frases curtas e marcantes (estilo manchete de banca de revista).

Crie UMA manchete personalizada de 1-2 frases (no MÁXIMO 30 palavras) pra esse
amigo da aniversariante Ju, baseada nos dados abaixo. Comece com o nome dele.
Não use aspas. Não repita a pontuação X/22 (já mostro em outro lugar).

Dados:
- Nome: ${input.nome}
- Pontuação: ${input.score}/${input.total}
- Tier: ${input.tier}
- Palavra que define a Ju: ${input.palavraUnica ?? "—"}
- Frase "A Ju pra mim é...": ${input.fraseCompletar ?? "—"}
- Música que define a Ju: ${input.musicaJu ?? "—"}
- Recado da pessoa: ${input.recado ?? "—"}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });

  return (response.text ?? "").trim();
}
