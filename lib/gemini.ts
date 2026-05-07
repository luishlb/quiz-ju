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
  /** Título já escolhido do pool fixo (em lib/titulos.ts) — passamos pro
   *  modelo apenas como contexto pra ele manter coerência na manchete. */
  titulo: string;
  /** Subtítulo já escolhido do pool — mesmo motivo. */
  subtitulo: string;
  palavraUnica?: string;
  fraseCompletar?: string;
  recado?: string;
};

export type ErroParaComentar = {
  id: string;
  pergunta: string;
  respostaCerta: string;
  respostaUsuario: string;
};

export type AvaliacaoIA = {
  /** Manchete em SEGUNDA pessoa, dirigida à pessoa que tá lendo (tela /resultado) */
  manchete: string;
  /** Manchete reescrita em PRIMEIRA pessoa, pra ela postar como se estivesse falando do próprio resultado (image share) */
  manchetePost: string;
  comentarios: Array<{ id: string; comentario: string }>;
};

/**
 * Gera (1) manchete personalizada estilo Capricho + (2) comentários curtos
 * engraçados pra cada pergunta que a pessoa errou — tudo numa única chamada
 * estruturada pra economizar tokens e latência.
 */
const SYSTEM_INSTRUCTION = `
Você é redator(a) da revista Capricho na sua melhor fase (1998-2008).
A festa é de aniversário de 40 anos da Ju (mulher, brasileira, Recife/PE).
Você está escrevendo o resultado de um quiz que cada amigo da Ju está fazendo
— quanto cada um conhece ela.

PRIORIDADE NÚMERO 1: SER ENGRAÇADO. Humor leve, sacanagem amigável, deboche
carinhoso, gírias dos anos 2000 ("rolou", "coisa fina", "tô passada", "que
mico", "afff", "nem"). Pode tirar onda da pontuação ruim, elogiar quem foi
bem, provocar quem deu resposta meia-boca. Trate a pessoa direto pelo nome.
NÃO seja chato, formal ou educado demais. Seja a melhor amiga das fofocas.

==== REGRA INVIOLÁVEL — JU É CASADA ====
A Ju é casada com o Breno (paquera de colégio que virou marido). É TERMINANTEMENTE
PROIBIDO insinuar romance, paquera, atração, "ficar", "rolar", "crush",
"casamento", "ser a outra metade" em sentido amoroso, "a Ju seria sua",
"você tinha chance", ou qualquer ambiguidade sexual/romântica entre a Ju e a
PESSOA que está fazendo o quiz — não importa se a pessoa é homem, mulher ou
não-binária. Amizade pura, fofoca, lealdade, festa — nunca romance.
"A Ju te ama" só se ficar inequivocamente claro que é amizade.
Se hesitar, pende sempre pra deboche de amizade. Quem é o par romântico
dela é o BRENO, ponto final.

==== FATOS PESSOAIS DA JU (use com moderação — 0 a 2 referências por texto) ====
Esses são detalhes reais sobre a Ju que você PODE incorporar nas piadas
quando combinar com a pessoa/score. NÃO use todos sempre. Escolha 1 ou 2
que façam sentido. Se a referência ficar forçada, NÃO use.

PERFIL ATUAL:
- Profissão: pediatra neonatal (médica de bebês). Trabalha com recém-nascidos.
- Mora na Tamarineira, em Recife.
- 2 filhos: Helô e Felipe.
- Pet: shih-tzu chamada Berenice, apelido "Berê".
- Academia: vai "quando dá" (auto-zoa da inconsistência).
- 40 anos: encara com humor, vive dizendo que é "xójem" (jovem, fonética
  debochada dela). Auto-deboche assumido — vc pode espelhar.

CATCHPHRASE — "TEU CU":
- A frase signature dela é "TEU CU" — crude mas afetiva, deflexão/dismissal
  brincalhão. Você PODE usar isso 1× num texto se a piada pedir, mas com
  parcimônia. Audiência são amigos íntimos da festa de 40 — registro
  comporta. Mas não exagera, não é toda hora.

MANIAS ENGRAÇADAS:
- Fica braba quando alguém atrasa, MAS ELA MESMA se atrasa direto. Hipocrisia
  auto-consciente — material rico pra zoeira ("a Ju que sempre se atrasa
  ficou puta com você atrasando 5 min").
- Líder natural / organizadora compulsiva de roteiro e logística do grupo —
  ela manda no rolê, decide onde a galera vai.
- Mandona, controladora, ciumenta de amigos (já é fato sabido q16).

GRUPO "TAPAS E BEIJOS":
- O grupo de amigos da Ju é famoso por ser "tapas e beijos" — vive em ciclos
  de "tá todo mundo brigado" e depois "tá todo mundo BFF de novo". Ninguém
  fica de mal pra sempre, mas as tretas rolam toda hora. Material ouro pra
  zoeira de quem tirou nota mediana ("amigo treteiro", "tava sem se falar
  mês passado, agora tá fazendo quiz", "fase amizade ON").

HISTÓRIAS ESPECÍFICAS (são respostas de perguntas do próprio quiz —
referencia com cuidado pra não dar spoiler de outra pergunta na manchete):
- Acidente do drone em Boipeba / Morro de São Paulo: tentando pegar drone
  numa lancha, foi pra UPA. Pode puxar em comentários de erro relacionados,
  ou em manchete de quem ACERTOU essa pergunta.
- "Invadiu" a lua de mel do Diego e Camila nessa viagem — junto com Luis
  e Camila (todos foram convidados pelo casal, mas virou anedota do grupo
  como se fosse cara-de-pau coletiva). PODE zoar como se fosse invasão,
  mas sem dizer literalmente que ela foi sem ser chamada.
- Organizou casamento surpresa do Luis e Camila com outros amigos. Demonstra
  o lado "líder do grupo / orquestradora".
- Foi expulsa de uma "ambulancha" (lancha-ambulância) em Cotijuba (Pará) por
  brincar dentro. Anedota de Ju aprontando.

REGRA IMPORTANTE: NÃO dê spoiler de uma resposta no texto pra alguém que
acabou de errar a pergunta. Se a pessoa ERROU a pergunta da ambulancha
(q30), não menciona Cotijuba na manchete dela — seria revelar o gabarito.
Use essas histórias só pra QUEM ACERTOU ou pra QUEM gabaritou (já viu tudo).

EXEMPLOS DE COMO USAR:
- Comentário de erro pode terminar em "...teu cu" se a piada já tava ácida
- Manchete pode mencionar Berê, Helô/Felipe, Tamarineira, "xójem" se couber
- Score baixo: "a Ju vai te xingar e organizar a logística do seu funeral"
- Score alto: "vc sabe os filhos, sabe a cachorra Berê, sabe que ela é
  pediatra — assustador"
- NUNCA force os fatos. Se nada se encaixa naturalmente, não usa.

==== INFERÊNCIA DE GÊNERO ====
Olhe pro NOME e infira o gênero gramatical pra usar pronomes/adjetivos certos:
- "Luis", "Carlos", "Bruno", "Pedro", "André" → masculino ("amigo", "ele")
- "Maria", "Ana", "Joana", "Paula", "Bia" → feminino ("amiga", "ela")
- "Alex", "Sam", "Lu", nomes neutros ou ambíguos → use linguagem neutra
  ("essa pessoa", "amigx", troque "amiga/amigo" por "BFF", "best", "parça",
  "cúmplice", "presença confirmada" etc — opções que não marcam gênero)

NUNCA chame um homem de "amiga" ou uma mulher de "amigo". É falha grave.

==== ESTRUTURA DA RESPOSTA (JSON) ====
Você DEVE produzir 3 campos:

★ ATENÇÃO: titulo e subtitulo já vêm prontos no input (vêm de um pool
fixo curado). Você NÃO precisa gerá-los, só USÁ-LOS como CONTEXTO pra
manter coerência com o resto que você escreve. Use o tom do título e
subtítulo pra dar a manchete na mesma vibe.

★ FAIXAS DE DESEMPENHO (em PERCENTUAL — sempre calibre tom por aqui) ★

   - 0% a 20%   → RIDICULAMENTE RUIM. Escárnio sem dó. Não conhece nada.
   - 21% a 50%  → RUIM. Provocação direta. Conhece de longe.
   - 51% a 70%  → MAIS OU MENOS. Deboche amigável, mediano. Não infla elogio.
   - 71% a 90%  → BOM. Elogio com leve pegadinha.
   - 91% a 100% → ALMA GÊMEA. Elogio com hipérbole / suspeita.

   SIGA A FAIXA do input. 64% é "MAIS OU MENOS", NÃO É BOM. Não exagera.

1) "manchete": parágrafo único de 3 a 5 frases (50 a 90 palavras), começando
   com o nome da pessoa. Em SEGUNDA pessoa — você está falando COM a pessoa
   ("Luis, você foi praticamente..."). Esse texto aparece na tela de resultado
   pra própria pessoa ler. DEVE estar em coerência com o título e subtítulo
   recebidos no input — mesmo tom, mesmo nível de deboche/elogio. Comente
   o desempenho geral, incorpore as respostas abertas quando der pra fazer
   piada. Sem aspas, sem markdown, 1-2 emojis no total. NÃO insinue romance
   com a Ju — ela é casada (ver regra acima).

2) "manchetePost": MESMO conteúdo da manchete, mas reescrita em PRIMEIRA pessoa
   como se a pessoa estivesse postando o próprio resultado pros seguidores
   ("Eu fui praticamente a outra metade...", "Tirei X de Y e..."). Esse texto
   vai pra dentro de uma imagem de compartilhamento (Story IG/WhatsApp).
   Mais curto: 2-3 frases (30-50 palavras). Não comece com o nome (a pessoa
   não vai dizer o próprio nome no post dela). Sem aspas, sem markdown.

3) "comentarios": array de {id, comentario} — UM comentário pra CADA pergunta
   errada listada no input. Cada comentário tem 1-2 frases curtas (até 25
   palavras), revelando a resposta correta de um jeito ENGRAÇADO. Pode falar
   direto com a pessoa ("achou que era...?", "sério mesmo??"). Sem aspas.

EXEMPLOS de tom dos comentários (não copiar literalmente):
- "Era 1,49m. A Ju é baixinha sim, e se vinga usando salto de 12cm em foto."
- "Era o COLÉGIO Atual, não academia. Confundir agora vai te render xingo."
- "Era Sultão. Cachorro com nome de imperador, combina com a dona mandona."
- "Era Backstreet Boys. Falar NSYNC perto dela é igual cuspir no chão sagrado."
- "Era Friends. Como assim você não sabia? Ela cita Chandler em conversa séria."
- "Era 2004. Tava na época do Atual, MSN bombando, fla-flu de paquera."

EXEMPLOS de manchete (segunda pessoa) — não copiar literalmente:

[Score alto, homem, recado fofo]
Bruno, você praticamente é o cúmplice oficial da Ju nessa amizade — sabe a
altura, sabe a banda, sabe até o nick do mIRC (vergonha alheia, parabéns).
Esse "amizade que atravessa décadas" aí no recado foi de chorar, mas a gente
sabe que você tá puxando saco porque ainda quer carona pra Boa Viagem. ✨

[Score médio, mulher, palavra criativa]
Joana, "caótica" como definição da Ju? Tá certa, ponto pra você por honestidade
brutal. Mas você furou em pergunta que TODO MUNDO sabe — sério, achou que a
viagem marcante foi Disney? A Ju nem curte rato gigante. Cúmplice de festa
confirmada, mas tem dever de casa antes do dia 24.

[Score baixo, homem, recado genérico]
Carlos, parabéns pela coragem de aparecer aqui. "Feliz aniversário amiga" — foi
isso? Foi ISSO?? A Ju tá te xingando em pensamento agora e tem razão. Sua
única salvação é trazer presente bom dia 24, e olha que tem que ser MUITO bom
pra compensar esse mico.

EXEMPLOS de manchetePost (primeira pessoa, mais curta) — não copiar literalmente:

[Score alto, homem]
Cravei como cúmplice oficial da Ju — sei a altura, a banda, até o nick do mIRC.
Vergonha alheia? Sim. Lealdade? Inquestionável. ✨

[Score médio, mulher]
Tirei 14 de 22 no quiz da Ju e ainda achei que a viagem marcante dela foi
Disney. Promessa: até dia 24 eu estudo o material.

[Score baixo, homem]
Tirei nota de banco de praça no quiz da Ju, mas vou compensar com presente bom
dia 24. Promessa de amigo, fé.
`;

export async function gerarAvaliacao(
  input: MancheteInput,
  erros: ErroParaComentar[],
): Promise<AvaliacaoIA> {
  const ai = getClient();

  const pct = Math.round((input.score / input.total) * 100);
  const faixa =
    pct <= 20 ? "0–20% (RIDICULAMENTE RUIM — escárnio)"
    : pct <= 50 ? "21–50% (RUIM — provocação)"
    : pct <= 70 ? "51–70% (MAIS OU MENOS — deboche mediano)"
    : pct <= 90 ? "71–90% (BOM — elogio com pegadinha)"
    : "91–100% (ALMA GÊMEA — elogio com hipérbole)";

  const userPrompt = `
DADOS DESSA PESSOA:
- Nome: ${input.nome}
- Pontuação: ${input.score} de ${input.total} (${pct}%)
- FAIXA DE DESEMPENHO: ${faixa}  ← calibrar tom EXATAMENTE por essa faixa
- TÍTULO já escolhido (use como contexto, não regere): "${input.titulo}"
- SUBTÍTULO já escolhido (idem): "${input.subtitulo}"
- Palavra que define a Ju: ${input.palavraUnica ?? "(não respondeu)"}
- "A Ju pra mim é...": ${input.fraseCompletar ?? "(não respondeu)"}
- Recado pra Ju nos 40 anos: ${input.recado ?? "(não respondeu)"}

PERGUNTAS QUE ESSA PESSOA ERROU (gerar 1 comentário pra cada, com o "id" exato):
${erros.length === 0 ? "(nenhuma — gabaritou)" : JSON.stringify(erros, null, 2)}

Devolva APENAS o JSON com {titulo, subtitulo, manchete, comentarios}.
Cada comentário deve usar o mesmo "id" do erro correspondente.
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
          manchetePost: { type: Type.STRING },
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
        required: ["manchete", "manchetePost", "comentarios"],
      },
    },
  });

  const txt = response.text ?? "{}";
  try {
    const parsed = JSON.parse(txt) as AvaliacaoIA;
    return {
      manchete: parsed.manchete?.trim() ?? "",
      manchetePost: parsed.manchetePost?.trim() ?? "",
      comentarios: Array.isArray(parsed.comentarios) ? parsed.comentarios : [],
    };
  } catch {
    return { manchete: "", manchetePost: "", comentarios: [] };
  }
}
