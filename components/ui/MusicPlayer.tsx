"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/music";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function MusicPlayer({ tracks }: { tracks: Track[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [volume, setVolume] = useState(50);

  const idxRef = useRef(0);
  const volumeRef = useRef(50);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const playTrackRef = useRef<(i: number) => void>(() => {});

  const hasYouTube = tracks.some((t) => t.type === "youtube");
  const track = tracks[idx];

  useEffect(() => {
    if (!hasYouTube) return;
    function init() {
      const firstYt = tracksRef.current.find((t) => t.type === "youtube");
      if (!firstYt) return;
      ytRef.current = new window.YT.Player("yt-player", {
        videoId: firstYt.src,
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: () => {
            setYtReady(true);
            ytRef.current.setVolume(volumeRef.current);
          },
          onStateChange: (e: { data: number }) => {
            const cur = tracksRef.current[idxRef.current];
            if (cur?.type !== "youtube") return;
            if (e.data === 0) {
              // จบเพลง → เล่นเพลงถัดไป
              playTrackRef.current((idxRef.current + 1) % tracksRef.current.length);
              return;
            }
            setPlaying(e.data === 1);
          },
        },
      });
    }
    if (window.YT?.Player) {
      init();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = init;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function playTrack(i: number) {
    const t = tracksRef.current[i];
    if (!t) return;
    setIdx(i);
    idxRef.current = i;
    if (t.type === "youtube") {
      audioRef.current?.pause();
      if (ytRef.current?.loadVideoById && ytReady) {
        ytRef.current.loadVideoById(t.src);
        ytRef.current.setVolume(volumeRef.current);
        ytRef.current.playVideo();
      }
    } else {
      if (ytRef.current?.pauseVideo) ytRef.current.pauseVideo();
      const a = audioRef.current;
      if (a) {
        a.src = `/${t.src}`;
        a.volume = volumeRef.current / 100;
        a.play().catch(() => {});
      }
    }
  }
  playTrackRef.current = playTrack;

  function toggle() {
    const t = tracksRef.current[idxRef.current];
    if (!t) return;
    if (t.type === "youtube") {
      if (!ytRef.current || !ytReady) return;
      if (playing) ytRef.current.pauseVideo();
      else ytRef.current.playVideo();
    } else {
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        a.pause();
      } else {
        if (!a.getAttribute("src")) {
          a.src = `/${t.src}`;
          a.volume = volumeRef.current / 100;
        }
        a.play().catch(() => {});
      }
    }
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    volumeRef.current = v;
    ytRef.current?.setVolume?.(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  }

  if (tracks.length === 0) return null;

  const ready = track.type === "youtube" ? ytReady : true;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 transition-all duration-300"
      style={{ filter: "drop-shadow(0 4px 12px rgba(44,36,22,0.15))" }}
    >
      <div id="yt-player" style={{ display: "none" }} />
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => playTrack((idxRef.current + 1) % tracks.length)}
      />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
      >
        {!minimized && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs leading-tight" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
              Now playing {tracks.length > 1 ? `· ${idx + 1}/${tracks.length}` : ""}
            </p>
            <p className="text-sm leading-snug" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
              {track.title}
            </p>
            <p className="text-xs mb-3" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
              {track.artist ?? " "}
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
                style={{ accentColor: "var(--accent)", backgroundColor: "var(--accent-light)" }}
              />
              <span className="text-xs w-6 text-right" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
                {volume}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 px-3 pb-3 pt-1">
          {/* Prev */}
          {tracks.length > 1 && (
            <button
              onClick={() => playTrack((idx - 1 + tracks.length) % tracks.length)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
              aria-label="Previous track"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M9 1v8L3.5 5 9 1zM1 1h1.5v8H1V1z" />
              </svg>
            </button>
          )}

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

          {/* Next */}
          {tracks.length > 1 && (
            <button
              onClick={() => playTrack((idx + 1) % tracks.length)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
              aria-label="Next track"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M1 1v8l5.5-4L1 1zm8 0H7.5v8H9V1z" />
              </svg>
            </button>
          )}

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
