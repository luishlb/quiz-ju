"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Player de fundo com pool aleatório.
 *
 * - Embaralha a lista no mount, pega a primeira
 * - Quando termina (state ENDED) ou dá erro → avança pra próxima
 * - Começa MUTADO (browsers bloqueiam autoplay com som)
 * - Botão flutuante toca/muta + mostra a música atual
 *
 * Pra adicionar/remover músicas: edite SONG_POOL abaixo.
 * Cada entrada é { id: "<youtube_video_id>", title: "Banda - Música" }.
 * O ID é o que vem depois de `v=` na URL do YouTube.
 */
const SONG_POOL: ReadonlyArray<{ id: string; title: string }> = [
  { id: "RsZS-JmzEUw", title: "Erasure - A Little Respect" },
  // ↑ adicione mais aqui no formato acima ↑
];

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        id: string,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
            onError?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
  }
}

type YTPlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  loadVideoById: (id: string) => void;
};

function shuffle<T>(arr: ReadonlyArray<T>): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function MusicButton() {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [songIdx, setSongIdx] = useState(0);
  const playerRef = useRef<YTPlayer | null>(null);
  const queueRef = useRef<typeof SONG_POOL>([]);
  const containerId = "yt-music-player";

  // Embaralha a fila uma vez no mount
  useEffect(() => {
    queueRef.current = shuffle(SONG_POOL);
  }, []);

  useEffect(() => {
    const queue = queueRef.current;
    if (queue.length === 0) return;
    const firstId = queue[0].id;

    const advance = () => {
      setSongIdx((prev) => {
        const next = (prev + 1) % queue.length;
        const p = playerRef.current;
        if (p) p.loadVideoById(queue[next].id);
        return next;
      });
    };

    const initPlayer = () => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId: firstId,
        playerVars: {
          autoplay: 1,
          mute: 1,
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
          onStateChange: ({ data }) => {
            if (data === 0) advance(); // ENDED
          },
          onError: () => {
            // vídeo bloqueado/removido → pula pra próxima
            advance();
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
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
  }, []);

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

  const skip = () => {
    const queue = queueRef.current;
    if (queue.length <= 1 || !playerRef.current) return;
    const next = (songIdx + 1) % queue.length;
    playerRef.current.loadVideoById(queue[next].id);
    setSongIdx(next);
    if (!muted) playerRef.current.playVideo();
  };

  const queue = queueRef.current;
  const currentTitle = queue[songIdx]?.title ?? "...";
  const hasMultiple = SONG_POOL.length > 1;

  return (
    <>
      {/* iframe escondido — só áudio */}
      <div className="fixed -left-[9999px] top-0 w-px h-px overflow-hidden" aria-hidden>
        <div id={containerId} />
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Tooltip com a música atual quando tocando */}
        {!muted && ready && (
          <div className="bg-white/90 backdrop-blur-sm border-2 border-rosa-bubble rounded-full px-3 py-1 text-[11px] font-display text-preto-revista max-w-[200px] truncate shadow-md">
            🎵 {currentTitle}
          </div>
        )}

        <div className="flex items-center gap-2">
          {hasMultiple && !muted && (
            <button
              type="button"
              onClick={skip}
              aria-label="Próxima música"
              className="bg-white text-rosa-choque border-2 border-rosa-bubble font-display text-sm px-3 py-2 rounded-full shadow-[2px_2px_0_rgba(0,0,0,0.2)] hover:scale-105 transition-transform"
            >
              ⏭
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            disabled={!ready}
            aria-label={muted ? "Ligar música" : "Mutar música"}
            className="bg-rosa-choque text-white font-display text-sm px-4 py-2 rounded-full shadow-[3px_3px_0_rgba(0,0,0,0.25)] hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
          >
            {!ready ? "🎵 carregando..." : muted ? "🔇 ligar som ♫" : "🔊 mutar"}
          </button>
        </div>
      </div>
    </>
  );
}
