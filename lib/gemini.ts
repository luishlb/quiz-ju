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

export type ErroParaComentar = {
  id: string;
  pergunta: string;
  respostaCerta: string;
  respostaUsuario: string;
};

export type AvaliacaoIA = {
  manchete: string;
  comentarios: Array<{ id: string; comentario: string }>;
};

/**
 * Gera (1) manchete personalizada estilo Capricho + (2) comentários curtos
 * engraçados pra cada pergunta que a pessoa errou — tudo numa única chamada
 * estruturada pra economizar tokens e latência.
 */
const SYSTEM_INSTRUCTION = `
Você é redator(a) da revista Capricho na sua melhor fase (1998-2008).
A festa é de aniversário de 40 anos da Ju. Você está escrevendo o resultado
de um quiz que cada amigo da Ju está fazendo — quanto cada um conhece ela.

PRIORIDADE NÚMERO 1: SER ENGRAÇADO. Humor leve, sacanagem amigável, deboche
carinhoso, gírias dos anos 2000 ("rolou", "coisa fina", "tô passada", "que
mico", "afff", "nem"). Pode tirar onda da pontuação ruim, elogiar quem foi
bem, provocar quem deu resposta meia-boca. Trate a pessoa direto pelo nome.
NÃO seja chato, formal ou educado demais. Seja a melhor amiga das fofocas.

VOCÊ DEVE PRODUZIR DOIS CAMPOS NO JSON DE RESPOSTA:

1) "manchete": parágrafo único de 3 a 5 frases (50 a 90 palavras), começando
   com o nome da pessoa. Comente o desempenho geral, incorpore as respostas
   abertas (palavra/frase/música/recado) quando der pra fazer piada. Se o
   recado for genérico, tira onda. Sem aspas, sem markdown, sem emojis em
   excesso (1-2 no total).

2) "comentarios": array de objetos {id, comentario} — UM comentário curto
   pra CADA pergunta errada listada no input. Cada comentário tem 1-2 frases
   curtas (máximo 25 palavras), revelando a resposta correta de um jeito
   ENGRAÇADO. Não use aspas. Não use o nome da pessoa repetidas vezes (já tá
   na manchete). Pode falar diretamente com a pessoa ("achou que era...?").

EXEMPLOS de tom dos comentários (não copiar literalmente):
- "Era 1,49m. A Ju é baixinha sim, e se vinga usando salto de 12cm em foto."
- "Era o COLÉGIO Atual, não academia. Confundir agora vai te render xingo."
- "Era Sultão. Cachorro com nome de imperador, combina com a dona mandona."
- "Era Backstreet Boys. Falar NSYNC perto dela é igual cuspir no chão sagrado."
- "Era Friends. Como assim você não sabia? Ela cita Chandler em conversa séria."
- "Era 2004. Tava na época do Atual, MSN bombando, fla-flu de paquera."

EXEMPLOS de manchete (não copiar literalmente):

[Score alto, recado fofo]
Maria, você é praticamente a outra metade da Ju — sabe a altura, sabe a banda,
sabe até o nick do mIRC (vergonha alheia, parabéns). Esse "amizade que atravessa
décadas" aí no recado foi de chorar, mas a gente sabe que você tá puxando saco
porque ainda quer carona pra Boa Viagem. Ju ❤ vc, mas anota: a Ju confere
lealdade no detalhe. ✨

[Score médio, palavra criativa]
Joana, "caótica" como definição da Ju? Tá certo, ponto pra você por honestidade
brutal. Mas você furou em pergunta que TODO MUNDO sabe — sério, achou que a
viagem marcante foi Disney? A Ju nem curte rato gigante. Nota: amiga de
quartel, presença confirmada, mas tem dever de casa antes do dia 24.

[Score baixo, recado genérico]
Carlos, parabéns pela coragem de aparecer aqui. "Feliz aniversário amiga" — foi
isso? Foi ISSO?? A Ju tá te xingando em pensamento agora e tem razão. Sua
única salvação é trazer presente bom dia 24, e olha que tem que ser MUITO bom
pra compensar esse mico aqui.
`;

export async function gerarAvaliacao(
  input: MancheteInput,
  erros: ErroParaComentar[],
): Promise<AvaliacaoIA> {
  const ai = getClient();

  const userPrompt = `
DADOS DESSA PESSOA:
- Nome: ${input.nome}
- Pontuação: ${input.score} de ${input.total}
- Tier: "${input.tier}"
- Palavra que define a Ju: ${input.palavraUnica ?? "(não respondeu)"}
- "A Ju pra mim é...": ${input.fraseCompletar ?? "(não respondeu)"}
- Música que define a Ju: ${input.musicaJu ?? "(não respondeu)"}
- Recado pra Ju nos 40 anos: ${input.recado ?? "(não respondeu)"}

PERGUNTAS QUE ELA ERROU (gerar 1 comentário pra cada, com o "id" exato):
${erros.length === 0 ? "(nenhuma — gabaritou)" : JSON.stringify(erros, null, 2)}

Devolva APENAS o JSON com {manchete, comentarios}. Cada comentário deve usar
o mesmo "id" do erro correspondente.
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.95,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          manchete: { type: Type.STRING },
          comentarios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                comentario: { type: Type.STRING },
              },
              required: ["id", "comentario"],
            },
          },
        },
        required: ["manchete", "comentarios"],
      },
    },
  });

  const txt = response.text ?? "{}";
  try {
    const parsed = JSON.parse(txt) as AvaliacaoIA;
    return {
      manchete: parsed.manchete?.trim() ?? "",
      comentarios: Array.isArray(parsed.comentarios) ? parsed.comentarios : [],
    };
  } catch {
    return { manchete: "", comentarios: [] };
  }
}
