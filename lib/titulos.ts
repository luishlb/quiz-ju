/**
 * Pools FIXOS de título + subtítulo por faixa de acertos do quiz.
 *
 * O Gemini cuidava disso antes mas saía meio aleatório/desconectado.
 * Agora título e subtítulo vêm de pools curados aqui — mais consistente,
 * sempre engraçado, alinhado com a faixa.
 *
 * A personalização vem do manchete + comentários por erro (esses
 * continuam IA-generated, com referências às respostas abertas).
 */

export type FaixaScore =
  | "0-20"   // ridiculamente ruim
  | "21-50"  // ruim
  | "51-70"  // mais ou menos
  | "71-90"  // bom
  | "91-100"; // alma gêmea

const TITULOS: Record<FaixaScore, ReadonlyArray<string>> = {
  "0-20": [
    "INTRUSO NA FESTA",
    "CADÊ O CONVITE?",
    "CONHECIDO DA PORTARIA",
    "AMIGO IMAGINÁRIO",
    "ZERO BALA",
  ],
  "21-50": [
    "AMIZADE DE LISTA",
    "CONHECIDO DE LONGE",
    "SUMIDO DESDE 2015",
    "AMIGO DE FACEBOOK",
    "PARÇA DE CORREDOR",
  ],
  "51-70": [
    "MEIO AMIGO MEIO LIMBO",
    "INTIMIDADE PARCIAL",
    "BFF MEIA-BOCA",
    "AMIZADE DE BAIRRO",
    "PARÇA DE FIM DE SEMANA",
  ],
  "71-90": [
    "GUARDA-COSTAS DA JU",
    "CÚMPLICE DE FOFOCA",
    "QUASE BFF",
    "SÓCIO DA INTIMIDADE",
    "PARÇA OFICIAL",
  ],
  "91-100": [
    "STALKER OFICIAL",
    "ARQUIVO VIVO DA JU",
    "ALMA GÊMEA NÍVEL FBI",
    "GÊMEA DE OUTRO PAI",
    "DOSSIÊ AMBULANTE",
  ],
};

const SUBTITULOS: Record<FaixaScore, ReadonlyArray<string>> = {
  "0-20": [
    "tem certeza que tá no quiz certo?",
    "a ju nem deve saber teu nome",
    "teu cu, basicamente",
    "é amigo do quê mesmo?",
    "agora é estudar pro próximo",
  ],
  "21-50": [
    "presente em festa, ausente no detalhe",
    "tu sabe o nome dela e olhe lá",
    "tira o pé do freio, parça",
    "amizade nível tag em foto antiga",
    "deu pra entrar mas não pra ficar",
  ],
  "51-70": [
    "quase, quase, quem sabe em 2030",
    "tem o básico mas falha no extra",
    "presença média, conteúdo médio",
    "amigo de aniversário e nada mais",
    "a ju te ama com ressalvas",
  ],
  "71-90": [
    "vc tá no grupo de verdade",
    "decora o cardápio dela faz tempo",
    "amigo nível segredo de gaveta",
    "merece convite pra tudo",
    "intimidade comprovada",
  ],
  "91-100": [
    "chamem o FBI, é assustador",
    "deve dormir com foto dela",
    "a ju te clonou, só pode",
    "sabe demais, levante suspeitas",
    "alma gêmea ou sociopata? sim",
  ],
};

export function faixaForScore(score: number, total: number): FaixaScore {
  const pct = (score / total) * 100;
  if (pct <= 20) return "0-20";
  if (pct <= 50) return "21-50";
  if (pct <= 70) return "51-70";
  if (pct <= 90) return "71-90";
  return "91-100";
}

/**
 * Sorteia título + subtítulo do pool da faixa correspondente.
 * Combinação aleatória entre os pools — variedade sem aleatoriedade
 * desconectada que o LLM dava.
 */
export function pickTituloSubtitulo(
  score: number,
  total: number,
): { titulo: string; subtitulo: string; faixa: FaixaScore } {
  const faixa = faixaForScore(score, total);
  const titulos = TITULOS[faixa];
  const subtitulos = SUBTITULOS[faixa];
  return {
    titulo: titulos[Math.floor(Math.random() * titulos.length)],
    subtitulo: subtitulos[Math.floor(Math.random() * subtitulos.length)],
    faixa,
  };
}
