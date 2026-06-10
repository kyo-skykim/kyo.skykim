"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "diary" | "photo" | "cv";

const card: React.CSSProperties = {
  backgroundColor: "var(--warm-white)",
  border: "1px solid var(--border)",
};

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--cream)",
  border: "1px solid var(--border)",
  color: "var(--ink)",
  fontFamily: "var(--font-inter, Inter, sans-serif)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter, Inter, sans-serif)",
  color: "var(--ink-light)",
};

// ย่อรูปฝั่ง browser ก่อนอัพ — กว้างสุด 1600px, JPEG 85%
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 800 * 1024) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("compress failed"))),
      "image/jpeg",
      0.85
    );
  });
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("diary");

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d.loggedIn)))
      .finally(() => setChecking(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <nav className="border-b py-4 px-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontWeight: 500, color: "var(--ink)", fontSize: "1.1rem" }}>
            My Diary
          </Link>
          {loggedIn && (
            <button
              onClick={async () => {
                await fetch("/api/admin/login", { method: "DELETE" });
                setLoggedIn(false);
              }}
              className="text-sm transition-opacity hover:opacity-60"
              style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}
            >
              ออกจากระบบ
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl mb-8" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
          Admin ✍️
        </h1>

        {checking ? (
          <p style={{ color: "var(--ink-light)", fontStyle: "italic", fontFamily: "var(--font-lora, Georgia, serif)" }}>
            กำลังตรวจสอบ...
          </p>
        ) : !loggedIn ? (
          <LoginForm onSuccess={() => setLoggedIn(true)} />
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              {([
                ["diary", "📝 ไดอารี่"],
                ["photo", "📷 รูป"],
                ["cv", "📄 CV"],
              ] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="text-sm px-4 py-2 rounded-full transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    backgroundColor: tab === t ? "var(--accent)" : "var(--accent-light)",
                    color: tab === t ? "#fff" : "var(--accent)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "diary" && <DiaryForm />}
            {tab === "photo" && <PhotoForm />}
            {tab === "cv" && <CvForm />}
          </>
        )}
      </main>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) onSuccess();
    else setError(data.error ?? "เกิดข้อผิดพลาด");
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={card}>
      <label className="block text-sm" style={labelStyle}>
        รหัสผ่าน
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none"
          style={inputStyle}
          autoFocus
        />
      </label>
      {error && <p className="text-sm" style={{ color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{error}</p>}
      <button
        type="submit"
        disabled={busy || !password}
        className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      >
        {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

function StatusMessage({ status }: { status: { ok: boolean; text: string } | null }) {
  if (!status) return null;
  return (
    <p
      className="text-sm rounded-xl px-4 py-3"
      style={{
        fontFamily: "var(--font-inter, Inter, sans-serif)",
        backgroundColor: status.ok ? "var(--accent-light)" : "#f5e0d8",
        color: status.ok ? "var(--accent)" : "#b3553a",
      }}
    >
      {status.text}
    </p>
  );
}

function DiaryForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("😊");
  const [coverEmoji, setCoverEmoji] = useState("📔");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/admin/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, mood, coverEmoji, tags }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: "โพสต์แล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" });
      setTitle("");
      setContent("");
      setTags("");
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={card}>
      <label className="block text-sm" style={labelStyle}>
        หัวข้อ
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
      </label>
      <label className="block text-sm" style={labelStyle}>
        เนื้อหา (ใช้ ## หัวข้อย่อย ได้)
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none resize-y" style={{ ...inputStyle, fontFamily: "var(--font-lora, Georgia, serif)" }} />
      </label>
      <div className="flex gap-3">
        <label className="block text-sm flex-1" style={labelStyle}>
          Mood
          <input value={mood} onChange={(e) => setMood(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none text-center" style={inputStyle} />
        </label>
        <label className="block text-sm flex-1" style={labelStyle}>
          Emoji ปก
          <input value={coverEmoji} onChange={(e) => setCoverEmoji(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none text-center" style={inputStyle} />
        </label>
      </div>
      <label className="block text-sm" style={labelStyle}>
        Tags (คั่นด้วย , )
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="เที่ยว, อาหาร" className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
      </label>
      <StatusMessage status={status} />
      <button type="submit" disabled={busy || !title.trim() || !content.trim()} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? "กำลังโพสต์..." : "โพสต์ไดอารี่"}
      </button>
    </form>
  );
}

function PhotoForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setStatus(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("file", compressed, file.name);
      form.append("caption", caption);
      form.append("location", location);
      const res = await fetch("/api/admin/photo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true, text: "อัพรูปแล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" });
        setFile(null);
        setPreview(null);
        setCaption("");
        setLocation("");
      } else {
        setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
      }
    } catch {
      setStatus({ ok: false, text: "ประมวลผลรูปไม่สำเร็จ ลองรูปอื่นดูนะ" });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={card}>
      <label className="block text-sm" style={labelStyle}>
        เลือกรูป
        <input type="file" accept="image/*" onChange={pick} className="mt-2 w-full text-sm" style={{ color: "var(--ink-light)" }} />
      </label>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="preview" className="w-full rounded-xl" style={{ border: "1px solid var(--border)" }} />
      )}
      <label className="block text-sm" style={labelStyle}>
        คำบรรยาย
        <input value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
      </label>
      <label className="block text-sm" style={labelStyle}>
        สถานที่
        <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
      </label>
      <StatusMessage status={status} />
      <button type="submit" disabled={busy || !file} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? "กำลังอัพโหลด..." : "อัพรูปขึ้น Gallery"}
      </button>
    </form>
  );
}

function CvForm() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/cv", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: "อัพเดต CV แล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" });
      setFile(null);
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={card}>
      <p className="text-sm" style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
        อัพไฟล์ PDF ใหม่มาแทน CV เดิมในหน้า About ได้เลย
      </p>
      <label className="block text-sm" style={labelStyle}>
        ไฟล์ CV (PDF)
        <input type="file" accept="application/pdf" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setStatus(null); }} className="mt-2 w-full text-sm" style={{ color: "var(--ink-light)" }} />
      </label>
      <StatusMessage status={status} />
      <button type="submit" disabled={busy || !file} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? "กำลังอัพโหลด..." : "อัพเดต CV"}
      </button>
    </form>
  );
}
