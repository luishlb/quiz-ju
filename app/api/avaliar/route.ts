/**
 * POST /api/avaliar
 *
 * Recebe { nome, respostas } do localStorage do cliente, calcula score
 * combinando matching local (multiple/aliases) + IA (Gemini) pra shorts ambíguos,
 * gera manchete personalizada e devolve resultado completo pra tela /resultado.
 *
 * Design: rota é a fonte da verdade — cliente nunca sabe o gabarito.
 */

import { NextResponse, type NextRequest } from "next/server";
import { QUESTIONS } from "@/data/questions";
import {
  gerarAvaliacao,
  validateShorts,
  type ErroParaComentar,
  type ShortValidationItem,
} from "@/lib/gemini";
import { registrarResultado } from "@/lib/db";
import { matchesAny, matchesKeyword } from "@/lib/normalize";
import type { AnswersMap } from "@/lib/scoring";
import { tierForScore } from "@/lib/titles";
import { pickTituloSubtitulo } from "@/lib/titulos";

export const runtime = "nodejs";

type AvaliarRequest = {
  nome: string;
  respostas: AnswersMap;
  tempoSegundos?: number;
  /** Quando true, pula o INSERT no Supabase (modo teste / debug) */
  skipPersist?: boolean;
};

type WrongItem = {
  id: string;
  pergunta: string;
  respostaUsuario: string;
  respostaCerta: string;
  /** Comentário curto e engraçado gerado pelo Gemini sobre o erro */
  comentario?: string;
};

export async function POST(request: NextRequest) {
  let body: AvaliarRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { nome, respostas, tempoSegundos, skipPersist } = body;
  if (!nome || typeof respostas !== "object") {
    return NextResponse.json({ error: "Payload incompleto" }, { status: 400 });
  }

  // 1. Score local — só pra multiple e shorts que batem com aliases/keywords
  let score = 0;
  const wrongItems: WrongItem[] = [];
  const shortsParaIA: ShortValidationItem[] = [];

  for (const q of QUESTIONS) {
    if (!q.scores) continue;
    const resp = (respostas[q.id] ?? "").trim();

    if (q.type === "multiple") {
      const idx = Number.parseInt(resp, 10);
      const certa = q.options[q.correctIndex];
      if (!Number.isNaN(idx) && idx === q.correctIndex) {
        score += 1;
      } else {
        const dada = !Number.isNaN(idx) ? q.options[idx] ?? "(em branco)" : "(em branco)";
        wrongItems.push({
          id: q.id,
          pergunta: q.prompt,
          respostaUsuario: dada,
          respostaCerta: certa,
        });
      }
      continue;
    }

    if (q.type === "short") {
      let acertou = false;
      if (q.aliases?.length) acertou = matchesAny(resp, q.aliases);
      if (!acertou && q.keywords?.length) acertou = matchesKeyword(resp, q.keywords);

      if (acertou) {
        score += 1;
      } else if (resp) {
        // Não bateu local, mas tem resposta — manda pra IA decidir
        const gabarito = q.aliases?.[0] ?? q.keywords?.[0] ?? "";
        shortsParaIA.push({
          id: q.id,
          pergunta: q.prompt,
          gabarito,
          resposta: resp,
        });
      } else {
        // Em branco
        const certa = q.aliases?.[0] ?? q.keywords?.join(" / ") ?? "—";
        wrongItems.push({
          id: q.id,
          pergunta: q.prompt,
          respostaUsuario: "(em branco)",
          respostaCerta: certa,
        });
      }
    }
  }

  // 2. Pede pra IA validar os shorts pendentes
  let iaValidations: Awaited<ReturnType<typeof validateShorts>> = [];
  try {
    iaValidations = await validateShorts(shortsParaIA);
  } catch (err) {
    console.error("validateShorts falhou:", err);
    // fallback: trata todos como errados
    iaValidations = shortsParaIA.map((i) => ({ id: i.id, correto: false }));
  }

  for (const item of shortsParaIA) {
    const v = iaValidations.find((x) => x.id === item.id);
    if (v?.correto) {
      score += 1;
    } else {
      wrongItems.push({
        id: item.id,
        pergunta: item.pergunta,
        respostaUsuario: item.resposta,
        respostaCerta: item.gabarito,
      });
    }
  }

  const total = QUESTIONS.filter((q) => q.scores).length;
  const tier = tierForScore(score);

  // 3. Sorteia título + subtítulo do POOL FIXO baseado na faixa percentual
  // (mais consistente que pedir pra IA gerar — antes saía meio aleatório).
  const { titulo, subtitulo } = pickTituloSubtitulo(score, total);

  // 4. Pega respostas abertas pra alimentar a manchete
  const palavraUnica = (respostas.q23 ?? "").toString().trim() || undefined;
  const fraseCompletar = (respostas.q24 ?? "").toString().trim() || undefined;
  const recado = (respostas.q26 ?? "").toString().trim() || undefined;

  // Prepara payload de erros pro Gemini comentar
  const errosParaIA: ErroParaComentar[] = wrongItems.map((w) => ({
    id: w.id,
    pergunta: w.pergunta,
    respostaCerta: w.respostaCerta,
    respostaUsuario: w.respostaUsuario,
  }));

  let manchete = "";
  let manchetePost = "";
  let moderacaoStatus: "ok" | "bloqueado" | "revisar" = "ok";
  let moderacaoMotivo: string | null = null;
  try {
    const avaliacao = await gerarAvaliacao(
      {
        nome,
        score,
        total,
        titulo,
        subtitulo,
        palavraUnica,
        fraseCompletar,
        recado,
      },
      errosParaIA,
    );
    manchete = avaliacao.manchete;
    manchetePost = avaliacao.manchetePost;
    moderacaoStatus = avaliacao.moderacao.status;
    moderacaoMotivo = avaliacao.moderacao.motivo ?? null;

    // Anexa cada comentário ao erro correspondente
    for (const c of avaliacao.comentarios) {
      const target = wrongItems.find((w) => w.id === c.id);
      if (target) target.comentario = c.comentario;
    }
  } catch (err) {
    console.error("gerarAvaliacao falhou:", err);
    manchete = `${nome}, você foi ${titulo}! ${subtitulo}.`;
    manchetePost = `Tirei ${score}/${total} no quiz da Ju — ${titulo}!`;
  }

  // 4. Persiste tudo no Postgres (silencioso — falha de DB não quebra a resposta).
  // Cada chamada do /resultado vira UMA linha — refazer = nova entrada com timestamp.
  // PULA quando skipPersist=true (modo teste via ?test=1 na URL).
  if (!skipPersist) {
    const userAgent = request.headers.get("user-agent");
    await registrarResultado({
      nome,
      pontuacao: score,
      total,
      titulo,
      subtitulo,
      manchete,
      manchete_post: manchetePost,
      respostas: respostas as Record<string, string>,
      tempo_segundos: typeof tempoSegundos === "number" ? tempoSegundos : null,
      user_agent: userAgent,
      moderacao_status: moderacaoStatus,
      moderacao_motivo: moderacaoMotivo,
    });
  }

  return NextResponse.json({
    score,
    total,
    tier, // emoji + cor
    titulo,
    subtitulo,
    manchete,
    manchetePost,
    wrong: wrongItems,
  });
}
