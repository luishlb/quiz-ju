"use client";

import { useEffect, useState } from "react";

const TARGET_ISO = "2027-04-24T19:00:00-03:00"; // 24/04/2027 19h Recife (BRT)

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calc(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function Countdown() {
  const target = new Date(TARGET_ISO).getTime();
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(calc(target));
    const id = setInterval(() => setTime(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Renderiza placeholder no SSR pra evitar mismatch de hidratação
  if (!time) {
    return (
      <div className="text-preto-revista/70 font-display text-sm">
        Carregando contagem regressiva...
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-display text-rosa-choque text-sm uppercase tracking-wider mb-2">
        Faltam pro reveillon nostalgia de Ju ✨
      </p>
      <div className="flex justify-center gap-2 sm:gap-4">
        <Cell value={time.days} label="dias" />
        <Cell value={time.hours} label="horas" />
        <Cell value={time.minutes} label="min" />
        <Cell value={time.seconds} label="seg" />
      </div>
    </div>
  );
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-[2px_2px_0_rgba(255,20,147,0.3)] border-2 border-rosa-choque/20">
      <div className="font-bubble text-rosa-choque text-2xl sm:text-3xl leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="font-display text-preto-revista/70 text-[10px] sm:text-xs uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
