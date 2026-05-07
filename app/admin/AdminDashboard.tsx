"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  created_at: string;
  nome: string;
  pontuacao: number;
  total: number;
  titulo: string | null;
  subtitulo: string | null;
  manchete: string | null;
  manchete_post: string | null;
  respostas: Record<string, string> | null;
  tempo_segundos: number | null;
  user_agent: string | null;
};

export function AdminDashboard() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/admin/respostas")
      .then(async (r) => {
        if (r.status === 401) {
          router.refresh();
          return null;
        }
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${r.status}`);
        }
        return (await r.json()) as { rows: Row[] };
      })
      .then((data) => {
        if (data) setRows(data.rows);
      })
      .catch((e: unknown) => {
        setErro(e instanceof Error ? e.message : "erro inesperado");
      });
  }, [router]);

  const stats = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const distinctNames = new Set(rows.map((r) => r.nome.trim().toLowerCase()));
    const total = rows.reduce((acc, r) => acc + r.pontuacao, 0);
    const media = total / rows.length;
    const maxScore = Math.max(...rows.map((r) => r.pontuacao));
    return {
      tentativas: rows.length,
      pessoas: distinctNames.size,
      media: media,
      maxScore,
    };
  }, [rows]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  const handleDeleteOne = async (id: string, nome: string) => {
    if (!window.confirm(`Apagar a tentativa de "${nome}"? Não dá pra desfazer.`)) return;
    const res = await fetch(`/api/admin/respostas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Falhou ao apagar");
      return;
    }
    setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleClearAll = async () => {
    const ok1 = window.confirm(
      "APAGAR TODAS as tentativas? Esse é destrutivo, sem volta.",
    );
    if (!ok1) return;
    const typed = window.prompt(
      'Pra confirmar, digite "limpar tudo" (sem aspas):',
    );
    if (typed?.toLowerCase().trim() !== "limpar tudo") {
      alert("cancelado");
      return;
    }
    const res = await fetch("/api/admin/respostas?confirm=1", {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Falhou ao limpar tudo");
      return;
    }
    setRows([]);
  };

  const exportCSV = () => {
    if (!rows) return;
    const header = [
      "id",
      "created_at",
      "nome",
      "pontuacao",
      "total",
      "titulo",
      "subtitulo",
      "manchete",
      "tempo_segundos",
    ];
    const escape = (v: unknown): string => {
      const s = v === null || v === undefined ? "" : String(v);
      const escaped = s.replace(/"/g, '""');
      return `"${escaped}"`;
    };
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.created_at,
          r.nome,
          r.pontuacao,
          r.total,
          r.titulo,
          r.subtitulo,
          r.manchete,
          r.tempo_segundos,
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-ju-respostas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (erro) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-4 text-center">
        <h1 className="font-bubble text-rosa-choque text-3xl">⚠️ deu ruim</h1>
        <p className="font-body text-preto-revista/70 text-sm max-w-md">{erro}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="font-display text-sm uppercase px-5 py-3 rounded-full border-2 border-rosa-bubble text-rosa-choque bg-white/70"
        >
          sair
        </button>
      </main>
    );
  }

  if (rows === null) {
    return (
      <main className="flex-1 flex items-center justify-center font-display text-preto-revista/60">
        🎀 carregando...
      </main>
    );
  }

  // Pin do Luis em #1 — zoeira (ele é o autor do quiz, juiz e jogador).
  // Pega a MELHOR tentativa dele (já sorted) e move pra topo.
  // Se ele não fez ainda, mostra placeholder.
  const luisIdx = rows.findIndex((r) => isLuis(r.nome));
  const rankingRows: Array<Row & { _placeholder?: boolean }> =
    luisIdx >= 0
      ? [rows[luisIdx], ...rows.filter((_, i) => i !== luisIdx)]
      : [
          {
            id: "luis-placeholder",
            created_at: "",
            nome: "Luis",
            pontuacao: 0,
            total: rows[0]?.total ?? 25,
            titulo: null,
            subtitulo: null,
            manchete: null,
            manchete_post: null,
            respostas: null,
            tempo_segundos: null,
            user_agent: null,
            _placeholder: true,
          },
          ...rows,
        ];

  // q26 = recado pra Ju (pergunta aberta long, vai pro mural)
  const recados = rows
    .map((r) => ({ nome: r.nome, recado: r.respostas?.q26 ?? "" }))
    .filter((r) => r.recado.trim().length > 0);

  // q23 e q24 = palavra única e frase pra Ju
  const palavras = rows
    .map((r) => ({ nome: r.nome, palavra: r.respostas?.q23 ?? "" }))
    .filter((r) => r.palavra.trim().length > 0);
  const frases = rows
    .map((r) => ({ nome: r.nome, frase: r.respostas?.q24 ?? "" }))
    .filter((r) => r.frase.trim().length > 0);

  return (
    <main className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="font-bubble text-rosa-choque text-3xl sm:text-4xl">
          🎀 Admin
        </h1>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/mural"
            target="_blank"
            rel="noreferrer"
            className="bg-rosa-choque text-white font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full hover:scale-105 transition-transform"
          >
            📺 abrir mural
          </a>
          <button
            type="button"
            onClick={exportCSV}
            className="bg-white border-2 border-rosa-bubble text-rosa-choque font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full hover:bg-rosa-pastel/30"
          >
            📥 export CSV
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="bg-white border-2 border-red-400 text-red-600 font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full hover:bg-red-50"
            title="apaga TODAS as tentativas"
          >
            🗑️ limpar tudo
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-white border-2 border-rosa-pastel text-preto-revista/70 font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full hover:bg-rosa-pastel/30"
          >
            sair
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="tentativas" value={String(stats.tentativas)} />
          <StatCard label="pessoas únicas" value={String(stats.pessoas)} />
          <StatCard
            label="média"
            value={`${stats.media.toFixed(1)} / ${rows[0]?.total ?? 25}`}
          />
          <StatCard
            label="maior nota"
            value={`${stats.maxScore} / ${rows[0]?.total ?? 25}`}
          />
        </div>
      )}

      {/* Ranking */}
      <Section title="🏆 Ranking">
        {rows.length === 0 && luisIdx < 0 ? (
          <p className="font-body text-preto-revista/60 text-sm">
            ninguém respondeu ainda
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-rosa-bubble bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rosa-pastel/40 font-display uppercase text-xs tracking-wider text-rosa-choque">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">nome</th>
                  <th className="px-3 py-2 text-left">título</th>
                  <th className="px-2 py-2 text-right">pontos</th>
                  <th className="px-2 py-2 text-right">tempo</th>
                  <th className="px-2 py-2 text-right">quando</th>
                  <th className="px-2 py-2 text-center w-10">×</th>
                </tr>
              </thead>
              <tbody>
                {rankingRows.map((r, i) => {
                  const isLuisRow = i === 0;
                  return (
                    <tr
                      key={r.id}
                      className={
                        isLuisRow
                          ? "bg-amarelo-glitter/25 border-y-2 border-amarelo-glitter"
                          : i % 2 === 0
                            ? "bg-white"
                            : "bg-rosa-pastel/10"
                      }
                    >
                      <td className="px-3 py-2 font-bubble text-rosa-choque text-base">
                        {isLuisRow ? "👑" : i + 1}
                      </td>
                      <td className="px-3 py-2 font-display">
                        <div className="font-bubble text-rosa-choque text-base">
                          {r.nome}
                        </div>
                        {isLuisRow && (
                          <div className="font-body italic text-[11px] text-preto-revista/70 normal-case">
                            o melhor amigo disparado — escrevi o quiz, sou juiz e jogador 🤷
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-display text-xs uppercase text-preto-revista/70">
                        {r._placeholder ? "(esperando aparecer)" : r.titulo}
                      </td>
                      <td className="px-2 py-2 text-right font-bubble text-rosa-choque">
                        {r._placeholder ? "—" : `${r.pontuacao}/${r.total}`}
                      </td>
                      <td className="px-2 py-2 text-right font-body text-preto-revista/60 text-xs">
                        {r._placeholder ? "—" : formatTempo(r.tempo_segundos)}
                      </td>
                      <td className="px-2 py-2 text-right font-body text-preto-revista/50 text-[11px]">
                        {r._placeholder ? "—" : formatData(r.created_at)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {!r._placeholder && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(r.id, r.nome)}
                            className="text-preto-revista/40 hover:text-red-600 transition-colors"
                            title="apagar essa tentativa"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Mensagens pra Ju */}
      <Section title="💌 Recados pra Ju">
        {recados.length === 0 ? (
          <p className="font-body text-preto-revista/60 text-sm">
            ainda sem recados
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recados.map((r, i) => (
              <li
                key={i}
                className="bg-white border-2 border-rosa-bubble rounded-xl p-4"
              >
                <p className="font-display text-rosa-choque text-xs uppercase tracking-wider mb-1">
                  {r.nome}
                </p>
                <p className="font-body text-preto-revista whitespace-pre-wrap text-sm">
                  {r.recado}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Palavras + frases */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="✨ Ju em uma palavra">
          {palavras.length === 0 ? (
            <p className="font-body text-preto-revista/60 text-sm">
              sem palavras
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {palavras.map((p, i) => (
                <li
                  key={i}
                  className="bg-white border-2 border-lilas rounded-full px-3 py-1 font-display text-sm"
                  title={p.nome}
                >
                  {p.palavra}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title='💖 "A Ju pra mim é..."'>
          {frases.length === 0 ? (
            <p className="font-body text-preto-revista/60 text-sm">
              sem frases
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {frases.map((f, i) => (
                <li
                  key={i}
                  className="bg-white border-2 border-lilas rounded-xl p-3"
                >
                  <p className="font-display text-rosa-choque text-[11px] uppercase mb-1">
                    {f.nome}
                  </p>
                  <p className="font-body text-preto-revista text-sm whitespace-pre-wrap">
                    {f.frase}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border-2 border-rosa-bubble rounded-xl p-3 text-center">
      <p className="font-bubble text-rosa-choque text-2xl">{value}</p>
      <p className="font-display text-[10px] uppercase tracking-wider text-preto-revista/60 mt-1">
        {label}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bubble text-rosa-choque text-xl">{title}</h2>
      {children}
    </section>
  );
}

/** Detecta se o nome é "Luis" (ou variações: Luís, Luiz) — case-insensitive,
 *  acentos opcionais. Usado pra fixar o autor do quiz no #1 do ranking. */
function isLuis(nome: string): boolean {
  const n = nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  return n === "luis" || n === "luiz";
}

function formatTempo(s: number | null): string {
  if (s === null || s === undefined) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m${r.toString().padStart(2, "0")}s` : `${r}s`;
}

function formatData(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } catch {
    return iso;
  }
}
