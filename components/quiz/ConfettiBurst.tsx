"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const EMOJIS = ["💖", "✨", "⭐", "💕", "🎀", "💎", "🌸", "💫", "🌟", "💞"];

type Piece = {
  id: number;
  emoji: string;
  x: number; // %
  y: number; // %
  size: number; // px
  rotate: number; // deg
  duration: number; // s
};

/**
 * Dispara um pequeno burst de confete (emojis) sempre que `trigger` muda.
 * Posicionado absoluto sobre o pai (precisa de `relative` no container).
 */
export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger < 0) return;
    const burst = Array.from({ length: 14 }, (_, i) => ({
      id: trigger * 100 + i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: 35 + Math.random() * 30, // partem do meio-superior
      y: 30 + Math.random() * 20,
      size: 18 + Math.random() * 22,
      rotate: Math.random() * 360,
      duration: 0.8 + Math.random() * 0.6,
    }));
    setPieces(burst);
    const id = setTimeout(() => setPieces([]), 1500);
    return () => clearTimeout(id);
  }, [trigger]);

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-visible z-20"
    >
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            initial={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: 0,
              scale: 0.4,
              rotate: 0,
            }}
            animate={{
              left: `${p.x + (Math.random() - 0.5) * 80}%`,
              top: `${p.y - 30 - Math.random() * 30}%`,
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1.3, 1.0, 0.6],
              rotate: p.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, ease: "easeOut" }}
            className="absolute select-none"
            style={{
              fontSize: `${p.size}px`,
              filter: "drop-shadow(0 2px 4px rgba(255,20,147,0.4))",
            }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
