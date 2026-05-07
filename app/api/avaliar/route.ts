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
import { matchesAny, matchesKeyword } from "@/lib/normalize";
import type { AnswersMap } from "@/lib/scoring";
import { registrarResultado } from "@/lib/supabase";
import { tierForScore } from "@/lib/titles";

export const runtime = "nodejs";

type AvaliarRequest = {
  nome: string;
  respostas: AnswersMap;
  tempoSegundos?: number;
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

  const { nome, respostas, tempoSegundos } = body;
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

  // 3. Pega respostas abertas pra alimentar a manchete
  const palavraUnica = (respostas.q23 ?? "").toString().trim() || undefined;
  const fraseCompletar = (respostas.q24 ?? "").toString().trim() || undefined;
  const musicaJu = (respostas.q25 ?? "").toString().trim() || undefined;
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
  let titulo = tier.title; // fallback estático
  let subtitulo = tier.subtitle;
  try {
    const avaliacao = await gerarAvaliacao(
      {
        nome,
        score,
        total,
        tier: tier.title,
        palavraUnica,
        fraseCompletar,
        musicaJu,
        recado,
      },
      errosParaIA,
    );
    manchete = avaliacao.manchete;
    manchetePost = avaliacao.manchetePost;
    if (avaliacao.titulo) titulo = avaliacao.titulo;
    if (avaliacao.subtitulo) subtitulo = avaliacao.subtitulo;

    // Anexa cada comentário ao erro correspondente
    for (const c of avaliacao.comentarios) {
      const target = wrongItems.find((w) => w.id === c.id);
      if (target) target.comentario = c.comentario;
    }
  } catch (err) {
    console.error("gerarAvaliacao falhou:", err);
    manchete = `${nome}, ${tier.title}! ${tier.subtitle}.`;
    manchetePost = `Tirei ${score}/${total} no quiz da Ju — ${tier.title}!`;
  }

  // 4. Persiste tudo no Supabase (silencioso — falha de DB não quebra a resposta).
  // Cada chamada do /resultado vira UMA linha — refazer = nova entrada com timestamp.
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
  });

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
