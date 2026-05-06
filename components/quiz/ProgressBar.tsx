"use client";

import { SECTION_TITLES } from "@/data/questions";

type Props = {
  current: number; // índice 0-based
  total: number;
  section: 1 | 2 | 3 | 4 | 5;
};

export function ProgressBar({ current, total, section }: Props) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full max-w-xl mx-auto sticky top-0 z-30 bg-rosa-pastel/80 backdrop-blur-md border-b-2 border-rosa-bubble py-3 px-4">
      <div className="flex justify-between items-center mb-1.5 font-display text-xs uppercase tracking-wider">
        <span className="text-rosa-choque font-bubble">
          {current + 1} / {total}
        </span>
        <span className="text-preto-revista/70 truncate ml-2 max-w-[60%] text-right text-[11px]">
          {SECTION_TITLES[section]}
        </span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-rosa-bubble/40">
        <div
          className="h-full bg-gradient-to-r from-rosa-choque to-lilas transition-[width] duration-500 ease-out shadow-[0_0_10px_rgba(255,20,147,0.6)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
