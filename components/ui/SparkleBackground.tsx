"use client";

import { useEffect, useState } from "react";

const EMOJIS = ["✨", "💖", "⭐", "💕", "🎀", "💎", "🌸", "💫"];
const COUNT = 18;

type Sparkle = {
  emoji: string;
  left: number; // %
  top: number; // %
  size: number; // px
  duration: number; // s
  delay: number; // s
  rotate: number; // deg
};

/**
 * Camada decorativa: emojis fixos no body, "flutuando" sutilmente
 * via animação CSS infinita. Não-interativo (pointer-events:none).
 */
export function SparkleBackground() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Gera no client (evita hydration mismatch com Math.random)
  useEffect(() => {
    const arr: Sparkle[] = Array.from({ length: COUNT }, (_, i) => ({
      emoji: EMOJIS[i % EMOJIS.length],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 14 + Math.random() * 24,
      duration: 4 + Math.random() * 5,
      delay: Math.random() * 3,
      rotate: Math.random() * 360,
    }));
    setSparkles(arr);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            transform: `rotate(${s.rotate}deg)`,
            animation: `sparkle-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: 0.55,
            filter: "drop-shadow(0 2px 4px rgba(255,20,147,0.3))",
          }}
        >
          {s.emoji}
        </span>
      ))}
      <style>{`
        @keyframes sparkle-float {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-12px) rotate(15deg) scale(1.15);
            opacity: 0.85;
          }
          50% {
            transform: translateY(-6px) rotate(-10deg) scale(0.9);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-14px) rotate(8deg) scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
