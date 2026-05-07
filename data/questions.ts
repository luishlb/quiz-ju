/**
 * Gabarito completo do quiz "Você é amiga(o) de verdade da Ju?"
 *
 * - Perguntas 1-22 pontuam (1 ponto cada). Tipos:
 *     - "multiple": opções fixas, 1 correta
 *     - "short": resposta curta, validação flexível por aliases ou keywords
 * - Perguntas 23-26 são abertas (não pontuam, alimentam o mural).
 *
 * IMPORTANTE: pergunta 22 está marcada como `tentative: true` —
 * resposta provável mas pode ser alterada via admin (pedido do Luis).
 */

export type QuestionId =
  | "q01" | "q02" | "q03" | "q04" | "q05"
  | "q07" | "q08" | "q09" | "q10" | "q11"
  | "q12" | "q13" | "q14" | "q15" | "q16" | "q17" | "q18"
  | "q19" | "q20" | "q21" | "q22"
  | "q27" | "q28" | "q29" | "q30"
  | "q23" | "q24" | "q25" | "q26";

type BaseQuestion = {
  id: QuestionId;
  section: 1 | 2 | 3 | 4 | 5;
  prompt: string;
};

export type MultipleChoice = BaseQuestion & {
  type: "multiple";
  options: string[];
  correctIndex: number;
  tentative?: boolean;
  scores: true;
};

export type ShortAnswer = BaseQuestion & {
  type: "short";
  /** Lista de respostas aceitas (match exato após normalize) */
  aliases?: string[];
  /** Lista de palavras-chave (resposta deve CONTER alguma) */
  keywords?: string[];
  scores: true;
};

export type OpenShort = BaseQuestion & {
  type: "open-short";
  scores: false;
};

export type OpenLong = BaseQuestion & {
  type: "open-long";
  scores: false;
};

export type Question = MultipleChoice | ShortAnswer | OpenShort | OpenLong;

export const QUESTIONS: Question[] = [
  // ── Seção 1 — O básico
  {
    id: "q01", section: 1, type: "multiple", scores: true,
    prompt: "Qual a altura da Ju?",
    options: ["1,47m", "1,49m", "1,52m", "1,55m", "1,58m"],
    correctIndex: 1,
  },
  {
    id: "q02", section: 1, type: "multiple", scores: true,
    prompt: "Qual o signo dela?",
    options: ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem"],
    correctIndex: 1,
  },
  {
    id: "q03", section: 1, type: "multiple", scores: true,
    prompt: "Quantos irmãos a Ju tem?",
    options: ["2", "3", "4", "5"],
    correctIndex: 2,
  },
  {
    id: "q04", section: 1, type: "multiple", scores: true,
    prompt: "Qual o nome da praça da infância dela?",
    options: [
      "Praça da Juventude (Robert Kennedy)",
      "Praça da Sudene",
      "Praça Marechal Soares D'Andréa",
      "Praça Marcelo Pinheiro Filho",
    ],
    correctIndex: 0,
  },
  {
    id: "q05", section: 1, type: "short", scores: true,
    prompt: "Qual o nome do primeiro cachorro dela?",
    aliases: ["sultao", "sultão", "sultan"],
  },

  // ── Seção 2 — Coração
  {
    id: "q07", section: 2, type: "short", scores: true,
    prompt: "Quem foi o primeiro namorado da Ju?",
    aliases: ["gustavo", "guga"],
  },
  {
    id: "q08", section: 2, type: "multiple", scores: true,
    prompt: "Quantos vestibulares a Ju fez até passar?",
    options: ["1", "2", "3", "4"],
    correctIndex: 2,
  },
  {
    id: "q09", section: 2, type: "multiple", scores: true,
    prompt: "Em que ano ela se formou na faculdade?",
    options: ["2011", "2012", "2013", "2014", "2015"],
    correctIndex: 2,
  },
  {
    id: "q10", section: 2, type: "short", scores: true,
    prompt: "Onde ela conheceu o Breno?",
    aliases: [
      "atual", "colegio atual", "colégio atual", "no atual",
      "no colegio atual", "no colégio atual", "atual mesmo",
    ],
  },
  {
    id: "q11", section: 2, type: "multiple", scores: true,
    prompt: "Em que ano ela conheceu o Breno?",
    options: ["2002", "2003", "2004", "2005", "2006"],
    correctIndex: 2,
  },

  // ── Seção 3 — Gostos
  {
    id: "q12", section: 3, type: "short", scores: true,
    prompt: "Qual a comida favorita da Ju?",
    aliases: ["chocolate"],
  },
  {
    id: "q13", section: 3, type: "multiple", scores: true,
    prompt: "Qual a banda que ela mais ouvia na adolescência?",
    options: [
      "Backstreet Boys",
      "NSync",
      "Hanson",
      "Britney Spears",
      "Sandy & Junior",
    ],
    correctIndex: 0,
  },
  {
    id: "q14", section: 3, type: "multiple", scores: true,
    prompt: "Qual a música que ela surta quando escuta (preferida da adolescência)?",
    options: [
      "I Want It That Way — Backstreet Boys",
      "A Little Respect — Erasure",
      "Bye Bye Bye — *NSYNC",
      "Self Esteem — The Offspring",
      "Photograph — Ed Sheeran",
    ],
    correctIndex: 1,
  },
  {
    id: "q15", section: 3, type: "multiple", scores: true,
    prompt: "Qual a série que a Ju assistiu mais vezes na vida?",
    options: [
      "Friends",
      "How I Met Your Mother",
      "Sex and the City",
      "Seinfeld",
      "Grey's Anatomy",
    ],
    correctIndex: 0,
  },
  {
    id: "q16", section: 3, type: "multiple", scores: true,
    prompt: "Qual a maior mania/cacoete da Ju?",
    options: [
      "Roer unha sem parar",
      "Querer mandar em tudo",
      "Falar muito alto",
      "Mexer no cabelo o tempo todo",
      "Estalar os dedos",
    ],
    correctIndex: 1,
  },
  {
    id: "q17", section: 3, type: "multiple", scores: true,
    prompt: "Qual a maior fobia dela?",
    options: ["Baratas", "Aranhas", "Altura", "Palhaço", "Lugar fechado"],
    correctIndex: 0,
  },
  {
    id: "q18", section: 3, type: "short", scores: true,
    prompt: "Qual era o nick dela no mIRC?",
    aliases: ["flor_de_liz", "flor de liz", "flordeliz", "flor-de-liz"],
  },

  // ── Seção 4 — Memórias
  {
    id: "q19", section: 4, type: "multiple", scores: true,
    prompt: "Qual a viagem mais marcante que a Ju já fez?",
    options: ["Chile", "Argentina", "Europa", "Estados Unidos", "Disney"],
    correctIndex: 0,
  },
  {
    id: "q20", section: 4, type: "short", scores: true,
    prompt: "Qual a festa mais marcante que a Ju já promoveu?",
    keywords: ["caveira", "aniversario do luis", "aniversário do luis", "luis 2018", "festa do luis"],
  },
  {
    id: "q21", section: 4, type: "multiple", scores: true,
    prompt: "Qual foi o primeiro porre que a Ju tomou?",
    options: [
      "Copa 2002 — é pentaaaa",
      "Formatura de medicina",
      "Primeiro churrasco na casa do Hugo (no Tobago) — \"Liga pra meu irmão\"",
      "Comemoração do vestibular de medicina",
      "Bar do Deca no pré-vestibular — andando no Geninha Móvel",
    ],
    correctIndex: 4,
  },
  {
    id: "q22", section: 4, type: "multiple", scores: true,
    tentative: true, // confirmar gabarito depois (Luis quer flexibilidade)
    prompt: "Onde a Ju quebrou o pé e precisou de cirurgia?",
    options: [
      "De patins, na praça",
      "De bicicleta, na praça",
      "Andando na rua do canal",
      "Dançando forró no São João da Capital",
      "De salto alto, no Alive",
    ],
    correctIndex: 0,
  },
  {
    id: "q27", section: 4, type: "short", scores: true,
    prompt: "Onde a Ju se acidentou tentando pegar um drone numa lancha e precisou ir pra UPA?",
    aliases: [
      "boipeba", "ilha de boipeba",
      "morro de sao paulo", "morro de são paulo", "morro",
      "boipeba morro", "boipeba/morro de são paulo",
      "ilha de boipeba (morro de são paulo)",
      "morro de sp", "morro são paulo",
    ],
  },
  {
    id: "q28", section: 4, type: "short", scores: true,
    prompt: "Nessa mesma viagem, ela foi invadir a lua de mel de qual casal recém-casado?",
    aliases: [
      "diego e camila", "diego/camila", "camila e diego",
      "diego camila", "diego, camila", "camila/diego",
    ],
  },
  {
    id: "q29", section: 4, type: "short", scores: true,
    prompt: "Pra qual casal a Ju organizou junto com outros amigos um casamento surpresa?",
    aliases: [
      "luis e camila", "luís e camila", "luis/camila", "camila e luis",
      "camila e luís", "luis camila", "luís camila", "camila/luis",
    ],
  },
  {
    id: "q30", section: 4, type: "short", scores: true,
    prompt: "Em qual praia a Ju estava quando foi expulsa de uma ambulancha?",
    aliases: [
      "cotijuba", "praia de cotijuba", "ilha de cotijuba",
      "cotijuba pa", "cotijuba pará", "cotijuba no pará",
      "praia cotijuba", "cotijuba/pa",
    ],
  },

  // ── Seção 5 — Revista (não pontuam)
  {
    id: "q23", section: 5, type: "open-short", scores: false,
    prompt: "Defina a Ju em UMA palavra:",
  },
  {
    id: "q24", section: 5, type: "open-long", scores: false,
    prompt: "Complete a frase: \"A Ju pra mim é...\"",
  },
  {
    id: "q25", section: 5, type: "open-short", scores: false,
    prompt: "Se a Ju fosse uma música, qual seria?",
  },
  {
    id: "q26", section: 5, type: "open-long", scores: false,
    prompt: "Mande um recado pra Ju nesses 40 anos 💌",
  },
];

export const SCORING_QUESTIONS = QUESTIONS.filter((q) => q.scores);
export const TOTAL_SCORING = SCORING_QUESTIONS.length; // 22

export const SECTION_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "📚 O básico que todo mundo deveria saber",
  2: "💘 Secretos do coração (SQN)",
  3: "🎵 Gostos e manias",
  4: "🎉 Memórias que só amigo de verdade sabe",
  5: "✨ Seção revista",
};
