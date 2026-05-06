"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureStart, getNome, setNome as saveNome } from "@/lib/storage";

export function NameForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = getNome();
    if (saved) setNome(saved);
    setHydrated(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nome.trim();
    if (!clean) return;
    saveNome(clean);
    ensureStart();
    router.push("/quiz");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 w-full max-w-sm">
      <label className="font-display text-rosa-choque text-sm uppercase tracking-wider text-center">
        Qual seu nome?
      </label>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="seu nome aqui ✨"
        maxLength={40}
        autoComplete="off"
        spellCheck={false}
        className="bg-white border-4 border-rosa-bubble rounded-xl px-5 py-3 font-display text-lg text-preto-revista placeholder:text-preto-revista/30 focus:outline-none focus:border-rosa-choque focus:shadow-[0_0_0_4px_rgba(255,105,180,0.3)] transition-all text-center"
      />
      <button
        type="submit"
        disabled={!hydrated || !nome.trim()}
        className="bg-rosa-choque text-white font-bubble text-xl tracking-wide px-8 py-4 rounded-full shadow-[5px_5px_0_rgba(26,26,26,0.4)] hover:scale-105 hover:rotate-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
      >
        COMEÇAR O TESTE 💖
      </button>
    </form>
  );
}
