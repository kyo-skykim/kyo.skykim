"use client";

import { useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin/client";
import { useUnsavedChanges } from "./useUnsavedChanges";

type PhotoDraft = {
  id: string; file: File; preview: string; caption: string; location: string; date: string;
  status: "pending" | "preparing" | "uploading" | "done" | "error";
  attempted?: boolean; error?: string;
};
const fieldStyle = { border: "1px solid var(--border)", background: "var(--cream)", color: "var(--ink)" };

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      };
    } catch {
      URL.revokeObjectURL(url);
      throw new Error("เบราว์เซอร์นี้อ่านรูปไม่ได้ กรุณาแปลงรูปเป็น JPG แล้วลองอีกครั้ง");
    }
  }
}

async function compressImage(file: File): Promise<Blob> {
  const heic = /\.(?:heic|heif)$/i.test(file.name) || /^image\/hei[cf]$/i.test(file.type);
  const image = await loadImageSource(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
  if (!heic && scale === 1 && file.size < 800 * 1024) {
    image.cleanup();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
  image.cleanup();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("compress failed"))),
      "image/jpeg",
      0.85
    );
  });
}

export default function PhotoUploader({ onUploaded }: { onUploaded?: () => void }) {
  const [items, setItems] = useState<PhotoDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const running = useRef(false);
  const prepared = useRef(new Map<string, Blob>());
  const previews = useRef(new Set<string>());
  const pending = items.filter((item) => item.status !== "done");
  useUnsavedChanges(pending.length > 0, busy);

  useEffect(() => {
    const urls = previews.current;
    const blobs = prepared.current;
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); blobs.clear(); };
  }, []);

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (running.current) return;
    const added: PhotoDraft[] = files.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { id: crypto.randomUUID(), file, preview, caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), location: "", date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }), status: "pending" };
    });
    setItems((current) => [...current, ...added]); setMessage("");
  }
  function update(id: string, patch: Partial<PhotoDraft>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  function remove(item: PhotoDraft) {
    URL.revokeObjectURL(item.preview); previews.current.delete(item.preview); prepared.current.delete(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }
  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (running.current || pending.length === 0) return;
    running.current = true; setBusy(true); setMessage("");
    let completed = 0;
    try {
      for (const item of pending) {
        try {
          update(item.id, { status: "preparing", error: undefined });
          let blob = prepared.current.get(item.id);
          if (!blob) { blob = await compressImage(item.file); prepared.current.set(item.id, blob); }
          const form = new FormData();
          form.append("file", blob, blob.type === "image/jpeg" ? `${item.file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg` : item.file.name);
          form.append("uploadId", item.id); form.append("caption", item.caption);
          form.append("location", item.location); form.append("date", item.date);
          update(item.id, { status: "uploading", attempted: true });
          const response = await adminFetch("/api/admin/photo", { method: "POST", body: form });
          const data = await response.json();
          if (!response.ok) {
            update(item.id, { status: "error", error: data.error ?? "อัปโหลดไม่สำเร็จ" });
            if ([401, 408, 503].includes(response.status)) break;
            continue;
          }
          update(item.id, { status: "done" }); completed += 1;
          prepared.current.delete(item.id);
        } catch (error) {
          update(item.id, { status: "error", error: error instanceof Error ? error.message : "อ่านรูปไม่สำเร็จ" });
        }
      }
      setMessage(completed === pending.length ? `อัปโหลดครบ ${completed} รูปแล้ว` : `สำเร็จ ${completed} จาก ${pending.length} รูปในรอบนี้ กดลองอีกครั้งเพื่อส่งเฉพาะรูปที่ยังไม่สำเร็จ`);
    } finally {
      running.current = false; setBusy(false);
      if (completed > 0) onUploaded?.();
    }
  }
  const labels = { pending: "รออัปโหลด", preparing: "กำลังเตรียมรูป…", uploading: "กำลังอัปโหลด…", done: "✓ อัปโหลดสำเร็จ", error: "อัปโหลดไม่สำเร็จ" };
  return (
    <form onSubmit={upload} aria-busy={busy} className="rounded-2xl p-4 sm:p-6 space-y-4" style={{ border: "1px solid var(--border)", background: "var(--warm-white)" }}>
      <input id="photo-file-input" type="file" accept="image/*,.heic,.heif" multiple disabled={busy} onChange={pick} className="hidden" />
      <label htmlFor="photo-file-input" className="block rounded-2xl py-8 text-center cursor-pointer" style={{ border: "2px dashed var(--accent)", background: "var(--accent-light)" }}>
        <span className="block text-3xl mb-2" aria-hidden="true">📷</span>
        <span>{items.length ? "เลือกรูปเพิ่ม" : "เลือกรูปจากอัลบั้ม"}</span>
        <span className="block text-xs mt-2">เลือกหลายรูปได้ ระบบบีบอัดก่อนส่ง</span>
      </label>
      <p className="text-xs" style={{ color: "var(--ink-light)" }}>รูปที่ยังไม่สำเร็จต้องเลือกใหม่หากปิดหน้านี้ ข้อความของรูปที่เริ่มส่งแล้วจะแก้ได้ในคลังรูปหลังอัปโหลดสำเร็จ</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => <div key={item.id} className="rounded-xl overflow-hidden" style={fieldStyle}>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt={item.file.name} className="w-full aspect-[4/3] object-cover" />
            <button type="button" disabled={busy} onClick={() => remove(item)} aria-label={`เอารูป ${item.file.name} ออกจากรายการ`} className="absolute top-2 right-2 rounded-full bg-black/70 text-white">×</button>
          </div>
          <div className="p-3 space-y-2">
            <label className="block text-sm">คำบรรยาย<input value={item.caption} disabled={busy || item.attempted} onChange={(event) => update(item.id, { caption: event.target.value })} className="mt-1 w-full rounded-lg px-3 py-2" style={fieldStyle} /></label>
            <label className="block text-sm">สถานที่<input value={item.location} disabled={busy || item.attempted} onChange={(event) => update(item.id, { location: event.target.value })} className="mt-1 w-full rounded-lg px-3 py-2" style={fieldStyle} /></label>
            <p role="status" className="text-sm" style={{ color: item.status === "error" ? "#b3553a" : "var(--accent)" }}>{labels[item.status]}{item.error ? ` · ${item.error}` : ""}</p>
          </div>
        </div>)}
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      <div className="admin-actions">
        <button type="submit" disabled={busy || pending.length === 0} className="w-full rounded-full py-3 text-sm disabled:opacity-40" style={{ background: "var(--accent)", color: "#fff" }}>{busy ? "กำลังอัปโหลด…" : items.some((item) => item.status === "error") ? `ลองอีกครั้ง ${pending.length} รูปที่ยังไม่สำเร็จ` : `อัปโหลด ${pending.length} รูป`}</button>
      </div>
    </form>
  );
}
