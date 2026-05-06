"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Player de fundo "A Little Respect" (Erasure) com controle de mute.
 * Começa MUTADO por padrão (browsers bloqueiam autoplay com som).
 * Botão flutuante grande no canto inferior direito.
 *
 * O ID do vídeo pode ser sobrescrito via env var NEXT_PUBLIC_MUSIC_YT_ID.
 * Default abaixo: lyric video oficial de "A Little Respect".
 */
const DEFAULT_VIDEO_ID = "RsZS-JmzEUw"; // troque se quiser outra versão

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        id: string,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: { onReady?: (e: { target: YTPlayer }) => void };
        }
      ) => YTPlayer;
    };
  }
}

type YTPlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
};

export function MusicButton() {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerId = "yt-music-player";
  const videoId = process.env.NEXT_PUBLIC_MUSIC_YT_ID ?? DEFAULT_VIDEO_ID;

  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: videoId, // necessário pra loop
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: ({ target }) => {
            target.setVolume(60);
            setReady(true);
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      // injeta o script da IFrame API uma única vez
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.playVideo();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  return (
    <>
      {/* iframe escondido — só pra rodar áudio */}
      <div className="fixed -left-[9999px] top-0 w-px h-px overflow-hidden" aria-hidden>
        <div id={containerId} />
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        aria-label={muted ? "Ligar música" : "Mutar música"}
        className="fixed bottom-4 right-4 z-50 bg-rosa-choque text-white font-display text-sm px-4 py-2 rounded-full shadow-[3px_3px_0_rgba(0,0,0,0.25)] hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
      >
        {!ready ? "🎵 carregando..." : muted ? "🔇 ligar som ♫" : "🔊 mutar"}
      </button>
    </>
  );
}
