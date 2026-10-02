"use client";

import { useState } from "react";

export default function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-xl cursor-zoom-in transition-opacity hover:opacity-90"
        style={{ border: "1px solid var(--border)" }}
      />

      {open && (
        <div
          className="motion-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(44,36,22,0.88)" }}
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="motion-dialog max-w-full max-h-full rounded-2xl shadow-2xl cursor-zoom-out"
            style={{ objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(false)}
            className="motion-button absolute top-4 right-4 w-9 h-9 rounded-full"
            style={{ backgroundColor: "var(--warm-white)", color: "var(--ink)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
