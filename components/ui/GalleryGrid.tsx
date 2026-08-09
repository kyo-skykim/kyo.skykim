"use client";

import { useEffect, useState } from "react";
import type { Photo } from "@/lib/gallery";

function formatDate(date?: string) {
  if (!date) return null;
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return date;

  return value.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [zoomed, setZoomed] = useState<Photo | null>(null);

  useEffect(() => {
    if (!zoomed) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomed]);

  return (
    <>
      <div className="columns-2 gap-4 sm:columns-3">
        {photos.map((photo, i) => (
          <button
            key={photo.file ?? i}
            type="button"
            className="break-inside-avoid mb-4 w-full overflow-hidden rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(44,36,22,0.05)" }}
            onClick={() => setZoomed(photo)}
            aria-label={photo.caption ? `ดูรูป: ${photo.caption}` : "ดูรูปขนาดใหญ่"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${photo.src}`}
              alt={photo.caption ?? ""}
              className="block w-full"
              style={{ backgroundColor: "var(--accent-light)" }}
            />
            {(photo.caption || photo.location || photo.date) && (
              <div className="px-3 py-2" style={{ backgroundColor: "var(--warm-white)" }}>
                {photo.caption && (
                  <p className="text-xs leading-snug" style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
                    {photo.caption}
                  </p>
                )}
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
                  {photo.location && <span>{photo.location}</span>}
                  {photo.date && <time dateTime={photo.date}>{formatDate(photo.date)}</time>}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          onClick={() => setZoomed(null)}
          role="dialog"
          aria-modal="true"
          aria-label={zoomed.caption ? `รูป: ${zoomed.caption}` : "ดูรูปขนาดใหญ่"}
        >
          <button
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity hover:opacity-60"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={() => setZoomed(null)}
            aria-label="ปิดรูปภาพ"
          >
            ✕
          </button>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl"
            style={{ backgroundColor: "var(--warm-white)" }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${zoomed.src}`}
              alt={zoomed.caption ?? ""}
              className="block max-h-[72vh] w-full object-contain"
              style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            />
            {(zoomed.caption || zoomed.location || zoomed.date) && (
              <div className="px-5 py-3">
                {zoomed.caption && (
                  <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
                    {zoomed.caption}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
                  {zoomed.location && <span>{zoomed.location}</span>}
                  {zoomed.date && <time dateTime={zoomed.date}>{formatDate(zoomed.date)}</time>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
