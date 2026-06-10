"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Tab = "new-post" | "posts" | "new-photo" | "photos" | "cv" | "about";
type AboutSection = "profile" | "experience" | "research" | "education" | "skills" | "certifications" | "languages";

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
  const [tab, setTab] = useState<Tab>("new-post");

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d.loggedIn)))
      .finally(() => setChecking(false));
  }, []);

  const tabs: [Tab, string][] = [
    ["new-post", "📝 โพสต์ใหม่"],
    ["posts", "✏️ โพสต์ทั้งหมด"],
    ["new-photo", "📷 รูปใหม่"],
    ["photos", "🖼️ รูปทั้งหมด"],
    ["cv", "📄 CV"],
    ["about", "👤 About"],
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <nav className="border-b py-4 px-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-6 py-12">
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
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map(([t, label]) => (
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
            {tab === "new-post" && <DiaryForm />}
            {tab === "posts" && <PostsList />}
            {tab === "new-photo" && <PhotoForm />}
            {tab === "photos" && <PhotosList />}
            {tab === "cv" && <CvForm />}
            {tab === "about" && <AboutEditor />}
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

// แปลงวันที่ให้ตรงรูปแบบ datetime-local ("YYYY-MM-DDTHH:mm") — ไม่งั้นช่อง input จะว่างแล้ววันที่เดิมหาย
function toDatetimeLocal(date: string): string {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return `${date}T00:00`;
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(date);
  return m ? `${m[1]}T${m[2]}` : "";
}

function DiaryForm({ initial, onSaved }: {
  initial?: {
    slug?: string;
    title?: string;
    content?: string;
    mood?: string;
    coverEmoji?: string;
    excerpt?: string;
    tags?: string[];
    date?: string;
    draft?: boolean;
  };
  onSaved?: () => void;
}) {
  const isEdit = Boolean(initial?.slug);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState(initial?.mood ?? "😊");
  const [coverEmoji, setCoverEmoji] = useState(initial?.coverEmoji ?? "📔");
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [date, setDate] = useState(toDatetimeLocal(initial?.date ?? ""));
  const [draft, setDraft] = useState(initial?.draft ?? false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);

    const payload = {
      title,
      content,
      mood,
      coverEmoji,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      excerpt,
      date,
      draft,
      ...(isEdit ? { slug: initial!.slug } : {}),
    };

    const res = await fetch(isEdit ? "/api/admin/posts" : "/api/admin/diary", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: isEdit ? "บันทึกแล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" : "โพสต์แล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" });
      if (!isEdit) {
        setTitle(""); setContent(""); setTags(""); setExcerpt(""); setDate(""); setDraft(false);
      }
      onSaved?.();
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
      <label className="block text-sm" style={labelStyle}>
        Excerpt (สรุปย่อ)
        <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
      </label>
      <label className="block text-sm" style={labelStyle}>
        วันที่ (เว้นว่างเพื่อใช้เวลาปัจจุบัน)
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={labelStyle}>
        <input
          type="checkbox"
          checked={draft}
          onChange={(e) => setDraft(e.target.checked)}
          className="rounded"
        />
        Draft (ซ่อนจากหน้าเว็บสาธารณะ)
      </label>
      <StatusMessage status={status} />
      <button type="submit" disabled={busy || !title.trim() || !content.trim()} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? (isEdit ? "กำลังบันทึก..." : "กำลังโพสต์...") : (isEdit ? "บันทึกการแก้ไข" : "โพสต์ไดอารี่")}
      </button>
    </form>
  );
}

interface PostItem {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  mood: string;
  coverEmoji: string;
  excerpt: string;
  tags: string[];
  readingTime: number;
}

function PostsList() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPost, setEditingPost] = useState<(PostItem & { content: string }) | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/posts");
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setPosts(data.posts ?? []);
    else setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openEdit(post: PostItem) {
    setLoadingSlug(post.slug);
    const res = await fetch(`/api/admin/posts/${post.slug}`);
    const data = await res.json().catch(() => ({}));
    setLoadingSlug(null);
    if (res.ok) setEditingPost(data);
  }

  async function deletePost(slug: string, title: string) {
    if (!confirm(`ลบโพสต์ "${title}" จริงๆ หรือ?`)) return;
    const res = await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDeleteStatus({ ok: true, text: `ลบ "${title}" แล้ว` });
      load();
    } else {
      setDeleteStatus({ ok: false, text: data.error ?? "ลบไม่สำเร็จ" });
    }
  }

  if (editingPost) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setEditingPost(null); load(); }}
          className="text-sm px-4 py-2 rounded-full transition-opacity hover:opacity-80"
          style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
        >
          ← กลับไปรายการโพสต์
        </button>
        <h2 className="text-xl" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)" }}>
          แก้ไขโพสต์: {editingPost.title}
        </h2>
        <DiaryForm
          initial={editingPost}
          onSaved={() => { setEditingPost(null); load(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatusMessage status={deleteStatus} />
      {loading && <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>กำลังโหลด...</p>}
      {error && <p className="text-sm" style={{ color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>ยังไม่มีโพสต์</p>
      )}
      {posts.map((post) => (
        <div key={post.slug} className="rounded-2xl p-4" style={card}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
                  {post.coverEmoji} {post.title}
                </span>
                {post.draft && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f5e0d8", color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                    🔒 Draft
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                {post.date} · {post.mood}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openEdit(post)}
                disabled={loadingSlug === post.slug}
                className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
              >
                {loadingSlug === post.slug ? "..." : "แก้ไข"}
              </button>
              <button
                onClick={() => deletePost(post.slug, post.title)}
                className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#f5e0d8", color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
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

interface PhotoItem {
  filename: string;
  caption: string;
  location: string;
  date: string;
}

function PhotosList() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/photo");
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setPhotos(data.photos ?? []);
    else setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(photo: PhotoItem) {
    setEditingPhoto(photo);
    setEditCaption(photo.caption);
    setEditLocation(photo.location);
    setEditDate(photo.date);
    setActionStatus(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPhoto) return;
    setBusy(true);
    const res = await fetch("/api/admin/photo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: editingPhoto.filename, caption: editCaption, location: editLocation, date: editDate }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setActionStatus({ ok: true, text: "บันทึกแล้ว!" });
      setEditingPhoto(null);
      load();
    } else {
      setActionStatus({ ok: false, text: data.error ?? "บันทึกไม่สำเร็จ" });
    }
  }

  async function deletePhoto(filename: string) {
    if (!confirm(`ลบรูป "${filename}" จริงๆ หรือ?`)) return;
    const res = await fetch("/api/admin/photo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setActionStatus({ ok: true, text: `ลบ "${filename}" แล้ว` });
      load();
    } else {
      setActionStatus({ ok: false, text: data.error ?? "ลบไม่สำเร็จ" });
    }
  }

  return (
    <div className="space-y-4">
      <StatusMessage status={actionStatus} />
      {editingPhoto && (
        <form onSubmit={saveEdit} className="rounded-2xl p-4 space-y-3" style={{ ...card, border: "1px solid var(--accent)" }}>
          <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink)" }}>
            แก้ไข: {editingPhoto.filename}
          </p>
          <label className="block text-sm" style={labelStyle}>
            คำบรรยาย
            <input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={labelStyle}>
            สถานที่
            <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={labelStyle}>
            วันที่
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="text-xs px-4 py-2 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
              {busy ? "..." : "บันทึก"}
            </button>
            <button type="button" onClick={() => setEditingPhoto(null)} className="text-xs px-4 py-2 rounded-full transition-opacity hover:opacity-80" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
              ยกเลิก
            </button>
          </div>
        </form>
      )}
      {loading && <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>กำลังโหลด...</p>}
      {error && <p className="text-sm" style={{ color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{error}</p>}
      {!loading && !error && photos.length === 0 && (
        <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>ยังไม่มีรูปใน Gallery</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.filename} className="rounded-xl overflow-hidden" style={card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/gallery/${photo.filename}`}
              alt={photo.caption || photo.filename}
              className="w-full aspect-square object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="p-2">
              <p className="text-xs truncate" style={{ color: "var(--ink)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                {photo.caption || photo.filename}
              </p>
              {photo.location && (
                <p className="text-xs truncate" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                  📍 {photo.location}
                </p>
              )}
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => startEdit(photo)}
                  className="text-xs px-2 py-1 rounded-full transition-opacity hover:opacity-80 flex-1"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => deletePhoto(photo.filename)}
                  className="text-xs px-2 py-1 rounded-full transition-opacity hover:opacity-80 flex-1"
                  style={{ backgroundColor: "#f5e0d8", color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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

interface AboutData {
  profile: {
    name: string;
    nickname: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    cv: string;
    summary: string;
  };
  experience: Array<{ year: string; role: string; company: string; items: string[] }>;
  research: Array<{ year: string; title: string; type: string; pdf?: string; image?: string; items: string[] }>;
  education: Array<{ year: string; degree: string; school: string }>;
  skills: Array<{ category: string; items: string[] }>;
  certifications: string[];
  languages: Array<{ lang: string; level: string }>;
}

function AboutEditor() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState<AboutSection>("profile");

  useEffect(() => {
    fetch("/api/admin/about")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("โหลดข้อมูลไม่สำเร็จ"); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>กำลังโหลด...</p>;
  if (error) return <p className="text-sm" style={{ color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{error}</p>;
  if (!data) return null;

  const sections: [AboutSection, string][] = [
    ["profile", "Profile"],
    ["experience", "Experience"],
    ["research", "Research"],
    ["education", "Education"],
    ["skills", "Skills"],
    ["certifications", "Certifications"],
    ["languages", "Languages"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sections.map(([s, label]) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              backgroundColor: section === s ? "var(--ink)" : "var(--accent-light)",
              color: section === s ? "#fff" : "var(--accent)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "profile" && <AboutProfileForm data={data} onSaved={setData} />}
      {section === "experience" && (
        <AboutArrayForm<AboutData["experience"][0]>
          section="experience" data={data} onSaved={setData}
          renderItem={(item) => `${item.year} — ${item.role} @ ${item.company}`}
          emptyItem={{ year: "", role: "", company: "", items: [] }}
          renderEditor={(item, onChange) => <ExperienceEditor item={item} onChange={onChange} />}
        />
      )}
      {section === "research" && (
        <AboutArrayForm<AboutData["research"][0]>
          section="research" data={data} onSaved={setData}
          renderItem={(item) => `${item.year} — ${item.title}`}
          emptyItem={{ year: "", title: "", type: "", items: [] }}
          renderEditor={(item, onChange) => <ResearchEditor item={item} onChange={onChange} />}
        />
      )}
      {section === "education" && (
        <AboutArrayForm<AboutData["education"][0]>
          section="education" data={data} onSaved={setData}
          renderItem={(item) => `${item.year} — ${item.degree}`}
          emptyItem={{ year: "", degree: "", school: "" }}
          renderEditor={(item, onChange) => <EducationEditor item={item} onChange={onChange} />}
        />
      )}
      {section === "skills" && (
        <AboutArrayForm<AboutData["skills"][0]>
          section="skills" data={data} onSaved={setData}
          renderItem={(item) => item.category}
          emptyItem={{ category: "", items: [] }}
          renderEditor={(item, onChange) => <SkillEditor item={item} onChange={onChange} />}
        />
      )}
      {section === "certifications" && <CertificationsEditor data={data} onSaved={setData} />}
      {section === "languages" && (
        <AboutArrayForm<AboutData["languages"][0]>
          section="languages" data={data} onSaved={setData}
          renderItem={(item) => `${item.lang} — ${item.level}`}
          emptyItem={{ lang: "", level: "" }}
          renderEditor={(item, onChange) => <LanguageEditor item={item} onChange={onChange} />}
        />
      )}
    </div>
  );
}

async function saveAbout(data: AboutData): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/about", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true };
  return { ok: false, error: result.error ?? "บันทึกไม่สำเร็จ" };
}

function AboutProfileForm({ data, onSaved }: { data: AboutData; onSaved: (d: AboutData) => void }) {
  const [profile, setProfile] = useState({ ...data.profile });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const newData = { ...data, profile };
    const result = await saveAbout(newData);
    setBusy(false);
    if (result.ok) {
      setStatus({ ok: true, text: "บันทึกแล้ว! 🎉" });
      onSaved(newData);
    } else {
      setStatus({ ok: false, text: result.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  const fields: Array<[keyof typeof profile, string, string?]> = [
    ["name", "ชื่อ"],
    ["nickname", "ชื่อเล่น"],
    ["location", "ที่อยู่"],
    ["phone", "โทรศัพท์"],
    ["email", "อีเมล", "email"],
    ["linkedin", "LinkedIn URL"],
    ["cv", "ชื่อไฟล์ CV"],
  ];

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-3" style={card}>
      {fields.map(([key, label, type]) => (
        <label key={key} className="block text-sm" style={labelStyle}>
          {label}
          <input
            type={type ?? "text"}
            value={profile[key]}
            onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
            className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
            style={inputStyle}
          />
        </label>
      ))}
      <label className="block text-sm" style={labelStyle}>
        Summary
        <textarea
          value={profile.summary}
          onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-xl px-3 py-2 outline-none resize-y"
          style={inputStyle}
        />
      </label>
      <StatusMessage status={status} />
      <button type="submit" disabled={busy} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? "กำลังบันทึก..." : "บันทึก Profile"}
      </button>
    </form>
  );
}

function AboutArrayForm<T>({
  section, data, onSaved, renderItem, emptyItem, renderEditor,
}: {
  section: keyof Omit<AboutData, "profile" | "certifications">;
  data: AboutData;
  onSaved: (d: AboutData) => void;
  renderItem: (item: T) => string;
  emptyItem: T;
  renderEditor: (item: T, onChange: (item: T) => void) => React.ReactNode;
}) {
  const items = (data[section] as T[]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<T>({ ...emptyItem });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(updated: T[]) {
    setBusy(true);
    const newData = { ...data, [section]: updated };
    const result = await saveAbout(newData);
    setBusy(false);
    if (result.ok) {
      setStatus({ ok: true, text: "บันทึกแล้ว! 🎉" });
      onSaved(newData);
      setEditIdx(null);
      setEditItem(null);
      setAdding(false);
      setNewItem({ ...emptyItem });
    } else {
      setStatus({ ok: false, text: result.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  async function deleteItem(idx: number) {
    if (!confirm("ลบรายการนี้จริงๆ หรือ?")) return;
    const updated = items.filter((_, i) => i !== idx);
    await save(updated);
  }

  return (
    <div className="space-y-3">
      <StatusMessage status={status} />
      {items.map((item, idx) => (
        <div key={idx} className="rounded-2xl p-4 space-y-3" style={card}>
          {editIdx === idx && editItem !== null ? (
            <>
              {renderEditor(editItem, setEditItem)}
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => {
                    const updated = items.map((it, i) => (i === idx ? editItem : it));
                    save(updated);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  {busy ? "..." : "บันทึก"}
                </button>
                <button
                  onClick={() => { setEditIdx(null); setEditItem(null); }}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  ยกเลิก
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm truncate" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink)" }}>
                {renderItem(item)}
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setEditIdx(idx); setEditItem({ ...item }); }}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => deleteItem(idx)}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#f5e0d8", color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  ลบ
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-2xl p-4 space-y-3" style={{ ...card, border: "1px solid var(--accent)" }}>
          {renderEditor(newItem, setNewItem)}
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => save([...items, newItem])}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
            >
              {busy ? "..." : "เพิ่ม"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewItem({ ...emptyItem }); }}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 rounded-full text-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
        >
          + เพิ่มรายการใหม่
        </button>
      )}
    </div>
  );
}

function ItemsEditor({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[idx] = e.target.value;
              onChange(updated);
            }}
            placeholder={placeholder}
            className="flex-1 rounded-xl px-3 py-1.5 outline-none text-sm"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="text-xs px-2 py-1.5 rounded-full"
            style={{ backgroundColor: "#f5e0d8", color: "#b3553a" }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-xs px-3 py-1 rounded-full"
        style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      >
        + เพิ่ม
      </button>
    </div>
  );
}

function ExperienceEditor({ item, onChange }: { item: AboutData["experience"][0]; onChange: (item: AboutData["experience"][0]) => void }) {
  return (
    <div className="space-y-2">
      {(["year", "role", "company"] as const).map((key) => (
        <label key={key} className="block text-xs" style={labelStyle}>
          {key}
          <input value={item[key]} onChange={(e) => onChange({ ...item, [key]: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-1.5 outline-none text-sm" style={inputStyle} />
        </label>
      ))}
      <p className="text-xs" style={labelStyle}>items</p>
      <ItemsEditor items={item.items} onChange={(updatedItems) => onChange({ ...item, items: updatedItems })} />
    </div>
  );
}

function ResearchEditor({ item, onChange }: { item: AboutData["research"][0]; onChange: (item: AboutData["research"][0]) => void }) {
  return (
    <div className="space-y-2">
      {(["year", "title", "type", "pdf", "image"] as const).map((key) => (
        <label key={key} className="block text-xs" style={labelStyle}>
          {key}
          <input value={item[key] ?? ""} onChange={(e) => onChange({ ...item, [key]: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-1.5 outline-none text-sm" style={inputStyle} />
        </label>
      ))}
      <p className="text-xs" style={labelStyle}>items</p>
      <ItemsEditor items={item.items} onChange={(updatedItems) => onChange({ ...item, items: updatedItems })} />
    </div>
  );
}

function EducationEditor({ item, onChange }: { item: AboutData["education"][0]; onChange: (item: AboutData["education"][0]) => void }) {
  return (
    <div className="space-y-2">
      {(["year", "degree", "school"] as const).map((key) => (
        <label key={key} className="block text-xs" style={labelStyle}>
          {key}
          <input value={item[key]} onChange={(e) => onChange({ ...item, [key]: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-1.5 outline-none text-sm" style={inputStyle} />
        </label>
      ))}
    </div>
  );
}

function SkillEditor({ item, onChange }: { item: AboutData["skills"][0]; onChange: (item: AboutData["skills"][0]) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs" style={labelStyle}>
        category
        <input value={item.category} onChange={(e) => onChange({ ...item, category: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-1.5 outline-none text-sm" style={inputStyle} />
      </label>
      <p className="text-xs" style={labelStyle}>items (ทักษะ)</p>
      <ItemsEditor items={item.items} onChange={(updatedItems) => onChange({ ...item, items: updatedItems })} />
    </div>
  );
}

function LanguageEditor({ item, onChange }: { item: AboutData["languages"][0]; onChange: (item: AboutData["languages"][0]) => void }) {
  return (
    <div className="flex gap-2">
      {(["lang", "level"] as const).map((key) => (
        <label key={key} className="block text-xs flex-1" style={labelStyle}>
          {key}
          <input value={item[key]} onChange={(e) => onChange({ ...item, [key]: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-1.5 outline-none text-sm" style={inputStyle} />
        </label>
      ))}
    </div>
  );
}

function CertificationsEditor({ data, onSaved }: { data: AboutData; onSaved: (d: AboutData) => void }) {
  const [certs, setCerts] = useState([...data.certifications]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const newData = { ...data, certifications: certs.filter(Boolean) };
    const result = await saveAbout(newData);
    setBusy(false);
    if (result.ok) {
      setStatus({ ok: true, text: "บันทึกแล้ว! 🎉" });
      onSaved(newData);
    } else {
      setStatus({ ok: false, text: result.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={card}>
      <ItemsEditor items={certs} onChange={setCerts} placeholder="ชื่อใบรับรอง" />
      <StatusMessage status={status} />
      <button type="submit" disabled={busy} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? "กำลังบันทึก..." : "บันทึก Certifications"}
      </button>
    </form>
  );
}
