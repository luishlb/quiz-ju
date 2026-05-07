"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JuMascot } from "@/components/ui/JuMascot";
import type { TitleTier } from "@/lib/titles";
import { clearAll, getAnswers, getNome, getTempoFinal } from "@/lib/storage";

type WrongItem = {
  id: string;
  pergunta: string;
  respostaUsuario: string;
  respostaCerta: string;
  comentario?: string;
};

type AvaliacaoResp = {
  score: number;
  total: number;
  tier: TitleTier;
  /** Título personalizado pela IA (ou fallback do tier) */
  titulo: string;
  /** Subtítulo personalizado pela IA (ou fallback do tier) */
  subtitulo: string;
  /** Manchete em 2ª pessoa pra mostrar na tela */
  manchete: string;
  /** Manchete em 1ª pessoa pra ir na imagem de share */
  manchetePost: string;
  wrong: WrongItem[];
};

export default function ResultadoPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"calculando" | "pronto" | "erro">("calculando");
  const [data, setData] = useState<AvaliacaoResp | null>(null);
  const [erro, setErro] = useState<string>("");

  useEffect(() => {
    const nome = getNome();
    const respostas = getAnswers();
    if (!nome) {
      router.replace("/");
      return;
    }
    if (Object.keys(respostas).length === 0) {
      router.replace("/quiz");
      return;
    }

    const tempoSegundos = getTempoFinal();

    fetch("/api/avaliar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, respostas, tempoSegundos }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as AvaliacaoResp;
      })
      .then((j) => {
        setData(j);
        setEstado("pronto");
      })
      .catch((e: unknown) => {
        setErro(e instanceof Error ? e.message : "Falha ao avaliar");
        setEstado("erro");
      });
  }, [router]);

  if (estado === "calculando") return <Calculando />;
  if (estado === "erro") return <Erro msg={erro} />;
  if (!data) return null;
  return <Resultado data={data} />;
}

function Calculando() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8 text-center">
      <motion.div
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="text-7xl"
      >
        💖
      </motion.div>
      <p className="font-display text-rosa-choque text-2xl uppercase tracking-wider">
        Calculando seu resultado...
      </p>
      <p className="font-body text-preto-revista/60">
        Conferindo se você é amiga(o) de verdade da Ju 💎
      </p>
    </main>
  );
}

function Erro({ msg }: { msg: string }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-4 text-center">
      <p className="text-7xl">😬</p>
      <h1 className="font-bubble text-rosa-choque text-3xl">deu ruim</h1>
      <p className="font-body text-preto-revista/70 max-w-md">
        Não consegui calcular seu resultado: <code className="bg-white/60 px-2 rounded">{msg}</code>
      </p>
      <a
        href="/quiz"
        className="font-display text-sm uppercase tracking-wider px-5 py-3 rounded-full border-2 border-rosa-bubble text-rosa-choque bg-white/70 hover:bg-white"
      >
        ← Voltar pro quiz
      </a>
    </main>
  );
}

function Resultado({ data }: { data: AvaliacaoResp }) {
  const { score, total, tier, titulo, subtitulo, manchete, manchetePost, wrong } = data;
  const pct = Math.round((score / total) * 100);
  const nome = typeof window !== "undefined" ? getNome() ?? "amigx" : "amigx";

  // Monta URL da imagem OG com todos os parâmetros pra renderização server-side
  const ogParams = new URLSearchParams({
    titulo,
    subtitulo,
    score: String(score),
    total: String(total),
    emoji: tier.emoji,
    manchete: manchetePost,
  });
  const ogUrl = `/api/og?${ogParams.toString()}`;

  const shareText = `Acabei de fazer o quiz "Você é amigo(a) de verdade da Ju?" e tirei ${score}/${total} — ${titulo} ${tier.emoji}\n\nFaz o seu também: ${typeof window !== "undefined" ? window.location.origin : ""}`;
  const wppHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-8 gap-6 max-w-xl mx-auto w-full">
      {/* Tier card */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="bg-white border-4 border-rosa-bubble rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0_rgba(199,125,255,0.4)] flex flex-col items-center gap-3 w-full"
      >
        {/* Mascote da Ju — feliz se mandou bem (≥8), chorando se foi mal */}
        <JuMascot mood={score >= 8 ? "feliz" : "triste"} size="lg" />
        <motion.span
          animate={{ scale: [1, 1.2, 1], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl -mt-2"
        >
          {tier.emoji}
        </motion.span>
        <h1 className="font-bubble text-rosa-choque text-3xl sm:text-4xl text-center leading-tight uppercase">
          {titulo}
        </h1>
        <p className="font-display text-preto-revista/70 text-center italic">
          {subtitulo}
        </p>

        {/* Score grande */}
        <div className="mt-2 flex items-baseline gap-2">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="font-bubble text-6xl sm:text-7xl text-rosa-choque"
          >
            {score}
          </motion.span>
          <span className="font-display text-2xl text-preto-revista/50">
            / {total}
          </span>
        </div>
        <p className="font-display text-sm uppercase tracking-wider text-lilas">
          {pct}% de acertos
        </p>
      </motion.div>

      {/* Manchete IA */}
      {manchete && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-amarelo-glitter/30 border-2 border-amarelo-glitter rounded-2xl p-5 w-full"
        >
          <p className="font-display text-xs uppercase tracking-widest text-rosa-choque mb-2">
            ✨ manchete da revista ✨
          </p>
          <p className="font-display text-preto-revista text-lg leading-snug">
            {manchete}
          </p>
        </motion.div>
      )}

      {/* Lista de erros */}
      {wrong.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full flex flex-col gap-3"
        >
          <h2 className="font-bubble text-rosa-choque text-xl text-center">
            o que escapou de você 👀
          </h2>
          <ul className="flex flex-col gap-2">
            {wrong.map((w) => (
              <li
                key={w.id}
                className="bg-white/85 border-2 border-rosa-pastel rounded-xl p-4 text-sm"
              >
                <p className="font-display text-preto-revista">{w.pergunta}</p>
                <p className="font-body text-preto-revista/60 mt-1">
                  você: <span className="line-through">{w.respostaUsuario}</span>
                </p>
                <p className="font-body text-rosa-choque">
                  resposta: <strong>{w.respostaCerta}</strong>
                </p>
                {w.comentario && (
                  <p className="font-display text-preto-revista/80 italic mt-2 pt-2 border-t border-rosa-pastel/50 text-[13px] leading-snug">
                    💅 {w.comentario}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* CTAs */}
      <ShareControls
        ogUrl={ogUrl}
        shareText={shareText}
        wppHref={wppHref}
        nome={nome}
      />
      <RefazerButton />

      <p className="text-center text-[11px] text-preto-revista/50 font-display tracking-wide -mt-1">
        seu resultado já foi registrado pra Ju conferir 💌
      </p>

      <p className="text-center mt-2 text-[11px] text-preto-revista/50 font-display tracking-wide">
        feito com 💖 pra Ju, edição limitada de 40 anos · {nome}
      </p>
    </main>
  );
}

/**
 * Botões de share com Web Share API (file share) + WhatsApp + download.
 *
 * - Mobile moderno: navigator.share({ files: [pngBlob], text }) abre a folha
 *   nativa de compartilhar e a pessoa escolhe Instagram, WhatsApp etc.
 * - Sem suporte a file share: cai pra `navigator.share({ text })` (texto-only)
 *   OU pro link wa.me como último fallback.
 * - Desktop: botão "baixar imagem" + abrir wa.me numa aba nova.
 */
function ShareControls({
  ogUrl,
  shareText,
  wppHref,
  nome,
}: {
  ogUrl: string;
  shareText: string;
  wppHref: string;
  nome: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [shareError, setShareError] = useState<string>("");

  // Pré-carrega a imagem em background — otimização. Se falhar, ok:
  // o handleShare ainda baixa na hora do clique. NÃO trava o botão.
  useEffect(() => {
    let cancelled = false;
    fetch(ogUrl)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b && !cancelled) setImageBlob(b);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ogUrl]);

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    setShareError("");
    try {
      let blob = imageBlob;
      if (!blob) {
        const res = await fetch(ogUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status} ao gerar imagem`);
        blob = await res.blob();
        setImageBlob(blob);
      }

      const file = new File([blob], `quiz-da-ju-${nome}.png`, {
        type: "image/png",
      });

      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: shareText });
      } else if (nav.share) {
        await nav.share({ text: shareText, url: window.location.origin });
      } else {
        // Desktop sem Web Share — download direto
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quiz-da-ju-${nome}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[share] falhou:", err);
      const msg =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : "deu ruim — usa o botão Baixar abaixo";
      setShareError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    let blob = imageBlob;
    if (!blob) {
      try {
        const res = await fetch(ogUrl);
        blob = await res.blob();
      } catch {
        setShareError("não consegui baixar");
        return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-da-ju-${nome}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3 w-full mt-2">
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className="bg-rosa-choque text-white font-bubble text-lg tracking-wide px-6 py-4 rounded-full shadow-[4px_4px_0_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-transform text-center disabled:opacity-60 disabled:cursor-wait"
      >
        {busy ? "🎀 gerando imagem..." : "📲 Compartilhar no Instagram/WhatsApp"}
      </button>

      {shareError && (
        <p className="font-display text-[11px] text-rosa-choque text-center -mt-1 px-2">
          ⚠️ {shareError}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setPreviewOpen((s) => !s)}
          className="flex-1 min-w-[100px] font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full border-2 border-rosa-pastel text-rosa-choque bg-white/70 hover:bg-white"
        >
          {previewOpen ? "🙈 esconder" : "👀 ver prévia"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 min-w-[100px] font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full border-2 border-rosa-pastel text-rosa-choque bg-white/70 hover:bg-white"
        >
          📥 baixar
        </button>
        <a
          href={wppHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[100px] font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full border-2 border-rosa-pastel text-rosa-choque bg-white/70 hover:bg-white text-center"
        >
          💬 só texto
        </a>
      </div>

      {previewOpen && (
        <div className="bg-white/85 rounded-2xl border-2 border-rosa-bubble p-3 mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogUrl}
            alt="Prévia do post"
            className="w-full rounded-xl"
            style={{ aspectRatio: "9/16", objectFit: "contain" }}
          />
          <p className="text-center mt-2 text-[11px] text-preto-revista/60 font-display">
            é assim que vai aparecer no Story 📱
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Botão "Refazer teste" — limpa todo o localStorage do quiz e volta pra landing.
 * Confirm dialog evita clique acidental. Resultado JÁ FOI persistido no DB
 * antes — então mesmo que o usuário refaça, o anterior ficou registrado
 * (ninguém consegue esconder score ruim).
 */
function RefazerButton() {
  const router = useRouter();
  const handleClick = () => {
    const ok = window.confirm(
      "Tem certeza? Vai apagar todas as suas respostas e começar de novo.",
    );
    if (!ok) return;
    clearAll();
    router.push("/");
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-display text-sm uppercase tracking-wider px-5 py-3 rounded-full border-2 border-rosa-bubble text-rosa-choque bg-white/70 hover:bg-white text-center w-full"
    >
      🔄 Refazer teste
    </button>
  );
}
