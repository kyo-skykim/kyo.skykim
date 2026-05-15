"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function MusicPlayer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    if (window.YT) {
      initPlayer();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initPlayer;
  }, []);

  function initPlayer() {
    playerRef.current = new window.YT.Player("yt-player", {
      videoId: "Aw2NpveLOFs",
      playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: "Aw2NpveLOFs" },
      events: {
        onReady: () => {
          setReady(true);
          playerRef.current.setVolume(50);
        },
        onStateChange: (e: { data: number }) => {
          setPlaying(e.data === 1);
        },
      },
    });
  }

  function toggle() {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-50 transition-all duration-300"
      style={{ filter: "drop-shadow(0 4px 12px rgba(44,36,22,0.15))" }}
    >
      <div id="yt-player" style={{ display: "none" }} />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
      >
        {!minimized && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs leading-tight" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
              Now playing
            </p>
            <p className="text-sm leading-snug" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
              Nagorizakura
            </p>
            <p className="text-xs mb-3" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
              AKB48
            </p>

            {/* Volume slider */}
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--ink-light)", flexShrink: 0 }}>
                <path d="M1 4h2l3-3v10L3 8H1V4z" fill="currentColor" />
                {volume > 0 && <path d="M8 2.5a4 4 0 0 1 0 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />}
                {volume > 40 && <path d="M9.5 1a6 6 0 0 1 0 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />}
              </svg>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolume}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "var(--accent)",
                  backgroundColor: "var(--accent-light)",
                }}
              />
              <span className="text-xs w-6 text-right" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
                {volume}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 px-3 pb-3 pt-1">
          {/* Play/Pause */}
          <button
            onClick={toggle}
            disabled={!ready}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="4" height="12" rx="1" />
                <rect x="8" y="1" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
              </svg>
            )}
          </button>

          {/* Minimize/Expand */}
          <button
            onClick={() => setMinimized((m) => !m)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
            aria-label={minimized ? "Expand" : "Minimize"}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              {minimized ? (
                <path d="M1 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              ) : (
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {playing && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: "var(--accent)" }}
        />
      )}
    </div>
  );
}
