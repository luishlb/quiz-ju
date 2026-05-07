"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim() || busy) return;
    setBusy(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.status === 401) {
        setErro("Senha errada");
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErro(data.error ?? "Erro inesperado");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede");
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-6 max-w-sm mx-auto w-full">
      <h1 className="font-bubble text-rosa-choque text-4xl">🔐 Admin</h1>
      <p className="font-display text-preto-revista/70 text-center text-sm uppercase tracking-wider">
        Só a Ju e o Luis passam aqui
      </p>

      <form onSubmit={submit} className="flex flex-col gap-4 w-full">
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="senha"
          autoComplete="current-password"
          autoFocus
          className="bg-white border-4 border-rosa-bubble rounded-xl px-5 py-3 font-display text-lg text-preto-revista placeholder:text-preto-revista/30 focus:outline-none focus:border-rosa-choque focus:shadow-[0_0_0_4px_rgba(255,105,180,0.3)] transition-all text-center"
        />

        {erro && (
          <p className="font-display text-sm text-rosa-choque text-center -mt-2">
            ⚠️ {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !pwd.trim()}
          className="bg-rosa-choque text-white font-bubble text-xl tracking-wide px-8 py-4 rounded-full shadow-[5px_5px_0_rgba(26,26,26,0.4)] hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {busy ? "🎀 entrando..." : "ENTRAR"}
        </button>
      </form>

      <a
        href="/"
        className="font-display text-xs uppercase tracking-wider text-preto-revista/50 hover:text-rosa-choque underline underline-offset-4 decoration-dotted"
      >
        ← voltar pro quiz
      </a>
    </main>
  );
}
