"use client";

import { useState } from "react";
import type { Photo } from "@/lib/gallery";

export default function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [zoomed, setZoomed] = useState<Photo | null>(null);

  return (
    <>
      <div className="columns-2 gap-4 sm:columns-3">
        {photos.map((photo, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{ border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(44,36,22,0.05)" }}
            onClick={() => setZoomed(photo)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${photo.src}`}
              alt={photo.caption ?? ""}
              className="w-full block"
              style={{ backgroundColor: "var(--accent-light)" }}
            />
            {(photo.caption || photo.location) && (
              <div className="px-3 py-2" style={{ backgroundColor: "var(--warm-white)" }}>
                {photo.caption && (
                  <p className="text-xs leading-snug" style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
                    {photo.caption}
                  </p>
                )}
                {photo.location && (
                  <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
                    {photo.location}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          onClick={() => setZoomed(null)}
        >
          <button
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-60"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={() => setZoomed(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <div
            className="max-w-3xl w-full rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${zoomed.src}`}
              alt={zoomed.caption ?? ""}
              className="w-full block"
            />
            {(zoomed.caption || zoomed.location || zoomed.date) && (
              <div className="px-5 py-3" style={{ backgroundColor: "var(--warm-white)" }}>
                {zoomed.caption && (
                  <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
                    {zoomed.caption}
                  </p>
                )}
                <div className="flex gap-4 mt-1 text-xs" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
                  {zoomed.location && <span>{zoomed.location}</span>}
                  {zoomed.date && <span>{zoomed.date}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
