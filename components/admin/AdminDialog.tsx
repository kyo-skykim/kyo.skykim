"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function AdminDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className="admin-dialog" aria-label={title} onCancel={(event) => { event.preventDefault(); onClose?.(); }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {onClose && <button type="button" aria-label="ปิดหน้าต่าง" onClick={onClose}>✕</button>}
      </div>
      {children}
    </dialog>
  );
}
