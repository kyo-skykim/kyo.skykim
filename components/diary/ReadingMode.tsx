"use client";

import { useState } from "react";

export default function ReadingMode({ contentHtml }: { contentHtml: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 rounded-full px-4 py-2 text-xs transition-opacity hover:opacity-75"
        style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--border)" }}
      >
        ◐ โหมดอ่านสบายตา
      </button>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "var(--cream)" }} role="dialog" aria-modal="true" aria-label="โหมดอ่านสบายตา">
          <div className="max-w-3xl mx-auto px-6 py-8 sm:py-12">
            <div className="flex justify-end mb-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-xs transition-opacity hover:opacity-75"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--border)" }}
              >
                ปิดโหมดอ่าน ×
              </button>
            </div>
            <article className="reading-mode-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>
        </div>
      )}
    </>
  );
}
