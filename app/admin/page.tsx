"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import MusicManagerStudio from "@/components/admin/MusicManagerStudio";
import type { CvAboutData, CvHistoryItem, CvPreview } from "@/lib/admin/cv-types";
import type { CurrentlyData, CurrentlyItem } from "@/lib/currently";

type Tab = "dashboard" | "new-post" | "posts" | "gallery" | "music" | "currently" | "cv" | "about";
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
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d.loggedIn)))
      .finally(() => setChecking(false));
  }, []);

  const tabs: [Tab, string, string][] = [
    ["dashboard", "⌂", "ภาพรวม"],
    ["new-post", "＋", "เขียน"],
    ["posts", "✎", "โพสต์"],
    ["gallery", "▧", "รูปภาพ"],
    ["music", "♫", "เพลง"],
    ["currently", "◌", "Currently"],
    ["about", "◯", "เกี่ยวกับ"],
    ["cv", "▤", "CV"],
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <nav className="border-b py-3 px-4 sm:px-6 sticky top-0 z-40" style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
              Creator studio
            </p>
            <Link href="/" style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontWeight: 500, color: "var(--ink)", fontSize: "1.1rem" }}>
              My Diary
            </Link>
          </div>
          {loggedIn && (
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="text-xs px-3 py-2 rounded-full transition-opacity hover:opacity-70"
                style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
              >
                เปิดเว็บไซต์ ↗
              </Link>
              <button
                onClick={async () => {
                  await fetch("/api/admin/login", { method: "DELETE" });
                  setLoggedIn(false);
                }}
                className="text-xs transition-opacity hover:opacity-60"
                style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}
              >
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {checking ? (
          <p style={{ color: "var(--ink-light)", fontStyle: "italic", fontFamily: "var(--font-lora, Georgia, serif)" }}>
            กำลังตรวจสอบ...
          </p>
        ) : !loggedIn ? (
          <LoginForm onSuccess={() => setLoggedIn(true)} />
        ) : (
          <>
            <div
              className="flex gap-1 mb-8 overflow-x-auto rounded-2xl p-1.5"
              style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
              aria-label="เมนูจัดการเว็บไซต์"
            >
              {tabs.map(([t, icon, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="min-w-[72px] flex-1 text-xs sm:text-sm px-3 py-2.5 rounded-xl transition-all hover:opacity-80 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                    backgroundColor: tab === t ? "var(--accent)" : "var(--accent-light)",
                    color: tab === t ? "#fff" : "var(--accent)",
                  }}
                >
                  <span className="block text-base leading-none mb-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
            {tab === "new-post" && (
              <AdminSection title="เขียนไดอารี่" description="ระบบบันทึกร่างให้อัตโนมัติบนเครื่องนี้">
                <DiaryForm />
              </AdminSection>
            )}
            {tab === "posts" && (
              <AdminSection title="โพสต์ทั้งหมด" description="ค้นหา แก้ไข หรือเปิดดูโพสต์ที่เผยแพร่แล้ว">
                <PostsList />
              </AdminSection>
            )}
            {tab === "gallery" && (
              <AdminSection title="คลังรูปภาพ" description="เพิ่มหลายรูปพร้อมกันและแก้คำบรรยายได้ในที่เดียว">
                <GalleryWorkspace />
              </AdminSection>
            )}
            {tab === "music" && (
              <AdminSection title="Playlist" description="เพิ่ม ทดลองฟัง แก้ไข และจัดลำดับเพลง">
                <MusicManagerStudio />
              </AdminSection>
            )}
            {tab === "currently" && (
              <AdminSection title="Currently" description="แก้ไขสิ่งที่กำลังทำ เรียน ฟัง หรือสนใจอยู่ตอนนี้">
                <CurrentlyEditor />
              </AdminSection>
            )}
            {tab === "about" && (
              <AdminSection title="เกี่ยวกับฉัน" description="จัดการข้อมูลแต่ละส่วนด้วยการ์ด">
                <AboutEditor />
              </AdminSection>
            )}
            {tab === "cv" && (
              <AdminSection title="เอกสาร CV" description="อ่านข้อความจาก PDF ตรวจแก้ แล้วอัปเดตหน้า About พร้อมกัน">
                <CvForm />
              </AdminSection>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
          {title}
        </h1>
        <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
          {description}
        </p>
      </div>
      {children}
    </section>
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

function useUnsavedWarning(active: boolean) {
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!active) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
}

interface DashboardSummary {
  posts: PostItem[];
  photoCount: number;
  trackCount: number;
  publish: {
    branch: string;
    commitSha: string;
    commitMessage: string;
    commitUrl: string;
    updatedAt: string;
    state: "success" | "pending" | "failure" | "unknown";
    checks: Array<{ name: string; status: string; conclusion: string | null; url?: string }>;
  } | null;
}

function Dashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [summary, setSummary] = useState<DashboardSummary>({
    posts: [],
    photoCount: 0,
    trackCount: 0,
    publish: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [postsRes, photosRes, musicRes, statusRes] = await Promise.all([
      fetch("/api/admin/posts"),
      fetch("/api/admin/photo"),
      fetch("/api/admin/music"),
      fetch("/api/admin/status"),
    ]);
    const [posts, photos, music, publish] = await Promise.all([
      postsRes.json().catch(() => ({})),
      photosRes.json().catch(() => ({})),
      musicRes.json().catch(() => ({})),
      statusRes.json().catch(() => ({})),
    ]);
    setLoading(false);
    if (![postsRes, photosRes, musicRes].every((response) => response.ok)) {
      setError(posts.error ?? photos.error ?? music.error ?? "โหลดภาพรวมไม่สำเร็จ");
    }
    setSummary({
      posts: posts.posts ?? [],
      photoCount: photos.photos?.length ?? 0,
      trackCount: music.tracks?.length ?? 0,
      publish: statusRes.ok ? publish : null,
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const publishedPosts = summary.posts.filter((post) => !post.draft).length;
  const draftPosts = summary.posts.filter((post) => post.draft).length;
  const publishLabel = {
    success: "เผยแพร่สำเร็จ",
    pending: "กำลังเผยแพร่",
    failure: "เผยแพร่ไม่สำเร็จ",
    unknown: "รอตรวจสอบ",
  }[summary.publish?.state ?? "unknown"];
  const publishColor = summary.publish?.state === "failure"
    ? "#b3553a"
    : summary.publish?.state === "pending"
      ? "#a06b2c"
      : "var(--accent)";

  const quickActions: Array<{ tab: Tab; icon: string; title: string; description: string }> = [
    { tab: "new-post", icon: "✍️", title: "เขียนโพสต์", description: "เริ่มเขียนพร้อม autosave" },
    { tab: "gallery", icon: "📷", title: "เพิ่มรูป", description: "เลือกได้หลายรูปพร้อมกัน" },
    { tab: "music", icon: "🎵", title: "เพิ่มเพลง", description: "วางลิงก์แล้วระบบเติมข้อมูลให้" },
    { tab: "about", icon: "👤", title: "แก้ About", description: "อัปเดตประวัติแบบการ์ด" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
            ยินดีต้อนรับกลับ
          </p>
          <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
            วันนี้อยากอัปเดตอะไร?
          </h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-3 py-2 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
        >
          {loading ? "กำลังโหลด..." : "↻ รีเฟรช"}
        </button>
      </div>

      {error && <StatusMessage status={{ ok: false, text: error }} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.tab}
            onClick={() => onNavigate(action.tab)}
            className="rounded-2xl p-4 sm:p-5 text-left transition-all hover:-translate-y-0.5"
            style={{ ...card, boxShadow: "0 1px 5px rgba(44,36,22,0.05)" }}
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="block mt-3 text-sm" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink)", fontWeight: 500 }}>
              {action.title}
            </span>
            <span className="block mt-1 text-xs leading-relaxed" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
              {action.description}
            </span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          ["โพสต์แล้ว", publishedPosts, "posts" as Tab],
          ["ฉบับร่าง", draftPosts, "posts" as Tab],
          ["รูปภาพ", summary.photoCount, "gallery" as Tab],
        ].map(([label, count, target]) => (
          <button
            key={String(label)}
            onClick={() => onNavigate(target as Tab)}
            className="rounded-2xl p-4 text-left"
            style={card}
          >
            <span className="text-2xl" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)" }}>{count}</span>
            <span className="block text-xs mt-1" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>{label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-2xl p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
              โพสต์ล่าสุด
            </h2>
            <button onClick={() => onNavigate("posts")} className="text-xs" style={{ color: "var(--accent)" }}>
              ดูทั้งหมด →
            </button>
          </div>
          <div className="space-y-2">
            {summary.posts.slice(0, 4).map((post) => (
              <button
                key={post.slug}
                onClick={() => onNavigate("posts")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left"
                style={{ backgroundColor: "var(--cream)" }}
              >
                <span className="text-xl">{post.coverEmoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm truncate" style={{ color: "var(--ink)" }}>{post.title}</span>
                  <span className="block text-xs" style={{ color: "var(--ink-light)" }}>{post.draft ? "ฉบับร่าง" : "เผยแพร่แล้ว"}</span>
                </span>
              </button>
            ))}
            {!loading && summary.posts.length === 0 && (
              <p className="text-sm py-4" style={{ color: "var(--ink-light)" }}>ยังไม่มีโพสต์</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
              สถานะเว็บไซต์
            </h2>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: publishColor }} />
          </div>
          <p className="text-sm mt-4" style={{ color: publishColor, fontWeight: 500 }}>{publishLabel}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--ink-light)" }}>
            {summary.publish?.commitMessage ?? "ยังอ่านสถานะ deployment ไม่ได้"}
          </p>
          {summary.publish && (
            <div className="mt-4 text-xs space-y-1" style={{ color: "var(--ink-light)" }}>
              <p>Branch: {summary.publish.branch}</p>
              <p>เพลงใน Playlist: {summary.trackCount}</p>
              <a href={summary.publish.commitUrl} target="_blank" rel="noreferrer" className="inline-block mt-2" style={{ color: "var(--accent)" }}>
                ดูการอัปเดตล่าสุด ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
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
  const draftKey = `kyo-admin-diary-${initial?.slug ?? "new"}`;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState(initial?.mood ?? "😊");
  const [coverEmoji, setCoverEmoji] = useState(initial?.coverEmoji ?? "📔");
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [date, setDate] = useState(toDatetimeLocal(initial?.date ?? ""));
  const [draft, setDraft] = useState(initial?.draft ?? false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const initialSnapshotRef = useRef("");

  const snapshot = useMemo(() => JSON.stringify({
    title, content, mood, coverEmoji, tags, excerpt, date, draft,
  }), [title, content, mood, coverEmoji, tags, excerpt, date, draft]);

  useEffect(() => {
    const initialSnapshot = JSON.stringify({
      title: initial?.title ?? "",
      content: initial?.content ?? "",
      mood: initial?.mood ?? "😊",
      coverEmoji: initial?.coverEmoji ?? "📔",
      tags: initial?.tags?.join(", ") ?? "",
      excerpt: initial?.excerpt ?? "",
      date: toDatetimeLocal(initial?.date ?? ""),
      draft: initial?.draft ?? false,
    });
    initialSnapshotRef.current = initialSnapshot;

    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && !isEdit) {
        const value = JSON.parse(saved);
        setTitle(value.title ?? "");
        setContent(value.content ?? "");
        setMood(value.mood ?? "😊");
        setCoverEmoji(value.coverEmoji ?? "📔");
        setTags(value.tags ?? "");
        setExcerpt(value.excerpt ?? "");
        setDate(value.date ?? "");
        setDraft(value.draft ?? true);
        setStatus({ ok: true, text: "กู้คืนฉบับร่างที่บันทึกอัตโนมัติแล้ว" });
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
    setDraftLoaded(true);
  }, [draftKey, initial, isEdit]);

  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      if (title.trim() || content.trim()) localStorage.setItem(draftKey, snapshot);
      else localStorage.removeItem(draftKey);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draftKey, draftLoaded, snapshot, title, content]);

  const dirty = draftLoaded && snapshot !== initialSnapshotRef.current && Boolean(title.trim() || content.trim());
  const scheduled = Boolean(date && Date.parse(date) > Date.now());

  useUnsavedWarning(dirty);

  async function savePost(nextDraft: boolean) {
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
      draft: nextDraft,
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
      localStorage.removeItem(draftKey);
      setDraft(nextDraft);
      const savedSnapshot = JSON.stringify({ title, content, mood, coverEmoji, tags, excerpt, date, draft: nextDraft });
      initialSnapshotRef.current = savedSnapshot;
      setStatus({
        ok: true,
        text: nextDraft ? "บันทึกเป็นฉบับร่างแล้ว" : "ส่งเผยแพร่แล้ว — ดูสถานะได้ที่หน้าภาพรวม",
      });
      if (!isEdit) {
        setTitle(""); setContent(""); setTags(""); setExcerpt(""); setDate(""); setDraft(false);
        initialSnapshotRef.current = JSON.stringify({
          title: "", content: "", mood, coverEmoji, tags: "", excerpt: "", date: "", draft: false,
        });
      }
      onSaved?.();
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-4 items-start">
      <form
        onSubmit={(event) => { event.preventDefault(); savePost(false); }}
        className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={card}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs" style={{ color: dirty ? "var(--accent)" : "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
            {dirty ? "● บันทึกร่างอัตโนมัติแล้ว" : "✓ ไม่มีข้อมูลค้าง"}
          </span>
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            className="lg:hidden text-xs px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
          >
            {previewOpen ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
          </button>
        </div>
        <label className="block text-sm" style={labelStyle}>
          หัวข้อ
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="วันนี้มีเรื่องอะไรอยากเล่า?" className="mt-2 w-full rounded-xl px-4 py-3 outline-none text-base" style={inputStyle} />
        </label>
        <label className="block text-sm" style={labelStyle}>
          เนื้อหา
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} placeholder={"เขียนได้ตามปกติ\n\nใช้ ## เพื่อสร้างหัวข้อย่อย"} className="mt-2 w-full rounded-xl px-4 py-3 outline-none resize-y leading-relaxed" style={{ ...inputStyle, fontFamily: "var(--font-lora, Georgia, serif)" }} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm" style={labelStyle}>
            Mood
            <input value={mood} onChange={(e) => setMood(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none text-center" style={inputStyle} />
          </label>
          <label className="block text-sm" style={labelStyle}>
            Emoji ปก
            <input value={coverEmoji} onChange={(e) => setCoverEmoji(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none text-center" style={inputStyle} />
          </label>
        </div>
        <label className="block text-sm" style={labelStyle}>
          Tags
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="เที่ยว, อาหาร" className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
        </label>
        <label className="block text-sm" style={labelStyle}>
          คำโปรย
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="เว้นว่างให้ระบบดึงจากเนื้อหา" className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
        </label>
        <label className="block text-sm" style={labelStyle}>
          วันเผยแพร่
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-2.5 outline-none" style={inputStyle} />
          <span className="block text-xs mt-1" style={{ color: "var(--ink-light)" }}>เว้นว่างเพื่อใช้เวลาปัจจุบัน</span>
        </label>
        <StatusMessage status={status} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => savePost(true)}
            disabled={busy || !title.trim() || !content.trim()}
            className="py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
          >
            {busy ? "กำลังบันทึก..." : "เก็บเป็นฉบับร่าง"}
          </button>
          <button type="submit" disabled={busy || !title.trim() || !content.trim()} className="py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
            {busy ? "กำลังส่ง..." : scheduled ? "ตั้งเวลาเผยแพร่" : isEdit && !draft ? "อัปเดตโพสต์" : "เผยแพร่"}
          </button>
        </div>
      </form>

      <div className={`${previewOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-28`}>
        <PostPreview title={title} content={content} mood={mood} coverEmoji={coverEmoji} excerpt={excerpt} tags={tags} />
      </div>
    </div>
  );
}

function PostPreview({ title, content, mood, coverEmoji, excerpt, tags }: {
  title: string;
  content: string;
  mood: string;
  coverEmoji: string;
  excerpt: string;
  tags: string;
}) {
  const lines = content.split("\n");
  const tagList = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  return (
    <aside className="rounded-2xl overflow-hidden" style={{ ...card, boxShadow: "0 4px 18px rgba(44,36,22,0.06)" }}>
      <div className="px-5 py-3 text-xs flex items-center justify-between" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        <span>ตัวอย่างก่อนเผยแพร่</span>
        <span>Preview</span>
      </div>
      <article className="p-6">
        <div className="text-4xl mb-4">{coverEmoji || "📔"}</div>
        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--accent)" }}>
          <span>{mood || "😊"}</span>
          <span>วันนี้</span>
        </div>
        <h2 className="text-2xl leading-snug" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
          {title || "หัวข้อโพสต์ของคุณ"}
        </h2>
        <p className="text-sm mt-3 italic leading-relaxed" style={{ color: "var(--ink-light)", fontFamily: "var(--font-lora, Georgia, serif)" }}>
          {excerpt || content.replace(/\s+/g, " ").slice(0, 100) || "คำโปรยจะแสดงตรงนี้"}
        </p>
        <div className="my-5" style={{ borderTop: "1px solid var(--border)" }} />
        <div className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--ink)", fontFamily: "var(--font-lora, Georgia, serif)" }}>
          {lines.map((line, index) => line.startsWith("## ") ? (
            <h3 key={index} className="text-lg pt-2" style={{ fontWeight: 600 }}>{line.slice(3)}</h3>
          ) : line.trim() ? (
            <p key={index}>{line}</p>
          ) : <div key={index} className="h-1" />)}
          {!content && <p style={{ color: "var(--ink-light)" }}>เริ่มเขียนเพื่อดูตัวอย่างเนื้อหา</p>}
        </div>
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {tagList.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </aside>
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
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

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter === "draft" && !post.draft) return false;
      if (filter === "published" && post.draft) return false;
      if (!needle) return true;
      return [post.title, post.excerpt, post.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [posts, query, filter]);

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
      <div className="rounded-2xl p-3 flex flex-col sm:flex-row gap-2" style={card}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาชื่อโพสต์ คำโปรย หรือ tag"
          className="flex-1 rounded-xl px-4 py-2.5 outline-none text-sm"
          style={inputStyle}
        />
        <div className="flex gap-1">
          {([
            ["all", "ทั้งหมด"],
            ["published", "เผยแพร่"],
            ["draft", "ฉบับร่าง"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl"
              style={{
                backgroundColor: filter === value ? "var(--accent)" : "var(--accent-light)",
                color: filter === value ? "#fff" : "var(--accent)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {loading && <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>กำลังโหลด...</p>}
      {error && <p className="text-sm" style={{ color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>ยังไม่มีโพสต์</p>
      )}
      {!loading && posts.length > 0 && filteredPosts.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "var(--ink-light)" }}>ไม่พบโพสต์ที่ค้นหา</p>
      )}
      {filteredPosts.map((post) => (
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
                {!post.draft && Date.parse(post.date) > Date.now() && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f5ead8", color: "#a06b2c", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                    🕒 ตั้งเวลา
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                {post.date} · {post.mood}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!post.draft && (
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "var(--cream)", color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                >
                  ดู ↗
                </Link>
              )}
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

interface PhotoDraft {
  id: string;
  file: File;
  preview: string;
  caption: string;
  location: string;
}

function GalleryWorkspace() {
  const [version, setVersion] = useState(0);
  const [uploaderOpen, setUploaderOpen] = useState(true);
  return (
    <div className="space-y-5">
      <button
        onClick={() => setUploaderOpen((open) => !open)}
        className="w-full rounded-2xl px-5 py-4 flex items-center justify-between text-left"
        style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--border)" }}
      >
        <span>
          <span className="block text-sm" style={{ fontWeight: 500 }}>＋ เพิ่มรูปใหม่</span>
          <span className="block text-xs mt-1" style={{ color: "var(--ink-light)" }}>เลือกหลายรูปได้ในครั้งเดียว</span>
        </span>
        <span>{uploaderOpen ? "−" : "+"}</span>
      </button>
      {uploaderOpen && (
        <PhotoForm
          onUploaded={() => {
            setVersion((value) => value + 1);
            setUploaderOpen(false);
          }}
        />
      )}
      <PhotosList key={version} />
    </div>
  );
}

function PhotoForm({ onUploaded }: { onUploaded?: () => void }) {
  const [items, setItems] = useState<PhotoDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  useUnsavedWarning(items.length > 0);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setStatus(null);
    setItems((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        location: "",
      })),
    ]);
  }

  function updateItem(id: string, patch: Partial<PhotoDraft>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function removeItem(id: string) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setBusy(true);
    setStatus(null);
    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setStatus({ ok: true, text: `กำลังอัปโหลดรูป ${index + 1}/${items.length}…` });
        const compressed = await compressImage(item.file);
        const form = new FormData();
        form.append("file", compressed, item.file.name);
        form.append("caption", item.caption);
        form.append("location", item.location);
        const res = await fetch("/api/admin/photo", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `อัปโหลด ${item.file.name} ไม่สำเร็จ`);
      }
      items.forEach((item) => URL.revokeObjectURL(item.preview));
      setItems([]);
      setStatus({ ok: true, text: `อัปโหลดครบ ${items.length} รูปแล้ว` });
      onUploaded?.();
    } catch (error) {
      setStatus({ ok: false, text: error instanceof Error ? error.message : "ประมวลผลรูปไม่สำเร็จ ลองรูปอื่นดูนะ" });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={card}>
      <input id="photo-file-input" type="file" accept="image/*" multiple onChange={pick} className="hidden" />
      <label
        htmlFor="photo-file-input"
        className="block rounded-2xl py-8 text-center cursor-pointer transition-opacity hover:opacity-80"
        style={{ border: "2px dashed var(--accent)", backgroundColor: "var(--accent-light)" }}
      >
        <span className="block text-3xl mb-2">📷</span>
        <span className="block text-sm" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)", fontWeight: 500 }}>
          {items.length > 0 ? "เลือกรูปเพิ่ม" : "เลือกรูปจากอัลบั้ม"}
        </span>
        <span className="block text-xs mt-1" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
          เลือกพร้อมกันได้หลายรูป ระบบจะบีบอัดให้อัตโนมัติ
        </span>
      </label>

      {items.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--cream)" }}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="w-full aspect-[4/3] object-cover" />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full text-sm"
                  style={{ backgroundColor: "rgba(44,36,22,0.78)", color: "#fff" }}
                  aria-label={`เอารูป ${item.file.name} ออก`}
                >
                  ×
                </button>
              </div>
              <div className="p-3 space-y-2">
                <input
                  value={item.caption}
                  onChange={(event) => updateItem(item.id, { caption: event.target.value })}
                  placeholder="คำบรรยาย"
                  className="w-full rounded-lg px-3 py-2 outline-none text-sm"
                  style={inputStyle}
                />
                <input
                  value={item.location}
                  onChange={(event) => updateItem(item.id, { location: event.target.value })}
                  placeholder="สถานที่ (ไม่บังคับ)"
                  className="w-full rounded-lg px-3 py-2 outline-none text-sm"
                  style={inputStyle}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <StatusMessage status={status} />
      <button type="submit" disabled={busy || items.length === 0} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
        {busy ? "กำลังอัปโหลด..." : `อัปโหลด ${items.length || ""} รูป`}
      </button>
    </form>
  );
}

interface PhotoItem {
  filename: string;
  caption: string;
  location: string;
  date: string;
  featured: boolean;
}

function PhotosList() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
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
    setEditFeatured(photo.featured);
    setActionStatus(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPhoto) return;
    setBusy(true);
    const res = await fetch("/api/admin/photo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: editingPhoto.filename,
        caption: editCaption,
        location: editLocation,
        date: editDate,
        featured: editFeatured,
      }),
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

  async function deleteSelected() {
    if (selected.length === 0 || !confirm(`ลบรูปที่เลือก ${selected.length} รูปจริงๆ หรือ?`)) return;
    setBusy(true);
    for (const filename of selected) {
      const res = await fetch("/api/admin/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionStatus({ ok: false, text: data.error ?? `ลบ ${filename} ไม่สำเร็จ` });
        setBusy(false);
        load();
        return;
      }
    }
    setSelected([]);
    setBusy(false);
    setActionStatus({ ok: true, text: `ลบ ${selected.length} รูปแล้ว` });
    load();
  }

  return (
    <div className="space-y-4">
      <StatusMessage status={actionStatus} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--ink-light)" }}>
          {photos.length} รูป {selected.length > 0 ? `· เลือกแล้ว ${selected.length}` : ""}
        </p>
        {selected.length > 0 && (
          <button
            onClick={deleteSelected}
            disabled={busy}
            className="text-xs px-3 py-2 rounded-full disabled:opacity-40"
            style={{ backgroundColor: "#f5e0d8", color: "#b3553a" }}
          >
            ลบรูปที่เลือก
          </button>
        )}
      </div>
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
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={labelStyle}>
            <input type="checkbox" checked={editFeatured} onChange={(event) => setEditFeatured(event.target.checked)} />
            ใช้เป็นรูปเด่นของ Gallery
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
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/gallery/${photo.filename}`}
                alt={photo.caption || photo.filename}
                className="w-full aspect-square object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <label className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: "rgba(255,254,249,0.9)" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(photo.filename)}
                  onChange={(event) => setSelected((current) => event.target.checked
                    ? [...current, photo.filename]
                    : current.filter((filename) => filename !== photo.filename))}
                  className="accent-[var(--accent)]"
                  aria-label={`เลือกรูป ${photo.caption || photo.filename}`}
                />
              </label>
              {photo.featured && (
                <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(44,36,22,0.78)", color: "#fff" }}>
                  ★ รูปเด่น
                </span>
              )}
            </div>
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

interface MusicTrack {
  type: "youtube" | "file";
  title: string;
  artist?: string;
  src: string;
}

export function LegacyMusicManager() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"youtube" | "file">("youtube");

  // YouTube form
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytArtist, setYtArtist] = useState("");

  // File form
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileArtist, setFileArtist] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/music");
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setTracks(data.tracks ?? []);
    else setStatus({ ok: false, text: data.error ?? "โหลดข้อมูลไม่สำเร็จ" });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addYouTube(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/admin/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: ytUrl, title: ytTitle, artist: ytArtist }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: "เพิ่มเพลงแล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" });
      setYtUrl(""); setYtTitle(""); setYtArtist("");
      load();
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  async function addFile(e: React.FormEvent) {
    e.preventDefault();
    if (!musicFile) return;
    if (musicFile.size > 4 * 1024 * 1024) {
      setStatus({ ok: false, text: "ไฟล์ใหญ่เกิน 4MB — ลองบีบอัดเพลง หรือใช้ลิงก์ YouTube แทน" });
      return;
    }
    setBusy(true);
    setStatus(null);
    const form = new FormData();
    form.append("file", musicFile);
    form.append("title", fileTitle);
    form.append("artist", fileArtist);
    const res = await fetch("/api/admin/music", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: "อัพเพลงแล้ว! 🎉 เว็บจะอัพเดตใน 1-2 นาที" });
      setMusicFile(null); setFileTitle(""); setFileArtist("");
      load();
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  async function deleteTrack(index: number, title: string) {
    if (!confirm(`ลบเพลง "${title}" จริงๆ หรือ?`)) return;
    const res = await fetch("/api/admin/music", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ ok: true, text: `ลบ "${title}" แล้ว` });
      load();
    } else {
      setStatus({ ok: false, text: data.error ?? "ลบไม่สำเร็จ" });
    }
  }

  return (
    <div className="space-y-4">
      <StatusMessage status={status} />

      {/* รายการเพลง */}
      {loading ? (
        <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>กำลังโหลด...</p>
      ) : (
        <div className="space-y-2">
          {tracks.length === 0 && (
            <p style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>ยังไม่มีเพลงใน playlist</p>
          )}
          {tracks.map((t, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={card}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl shrink-0">{t.type === "youtube" ? "▶️" : "🎧"}</span>
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
                    {t.title}
                  </p>
                  <p className="text-xs truncate" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
                    {t.artist ?? ""} {t.artist ? "· " : ""}{t.type === "youtube" ? "YouTube" : "ไฟล์เพลง"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteTrack(i, t.title)}
                className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 shrink-0"
                style={{ backgroundColor: "#f5e0d8", color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}

      {/* สลับโหมดเพิ่มเพลง */}
      <div className="flex gap-2 pt-2">
        {([["youtube", "🔗 จากลิงก์ YouTube"], ["file", "📁 อัพไฟล์เพลง"]] as ["youtube" | "file", string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              backgroundColor: mode === m ? "var(--ink)" : "var(--accent-light)",
              color: mode === m ? "#fff" : "var(--accent)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "youtube" ? (
        <form onSubmit={addYouTube} className="rounded-2xl p-6 space-y-3" style={card}>
          <label className="block text-sm" style={labelStyle}>
            ลิงก์ YouTube
            <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://youtu.be/..." className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={labelStyle}>
            ชื่อเพลง
            <input value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={labelStyle}>
            ศิลปิน (ไม่บังคับ)
            <input value={ytArtist} onChange={(e) => setYtArtist(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <button type="submit" disabled={busy || !ytUrl.trim() || !ytTitle.trim()} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
            {busy ? "กำลังเพิ่ม..." : "เพิ่มเพลงจาก YouTube"}
          </button>
        </form>
      ) : (
        <form onSubmit={addFile} className="rounded-2xl p-6 space-y-3" style={card}>
          <input
            id="music-file-input"
            type="file"
            accept=".mp3,.mp4,.m4a,.aac,.wav,.ogg,audio/*"
            onChange={(e) => { setMusicFile(e.target.files?.[0] ?? null); setStatus(null); }}
            className="hidden"
          />
          <label
            htmlFor="music-file-input"
            className="block rounded-2xl py-8 text-center cursor-pointer transition-opacity hover:opacity-80"
            style={{ border: "2px dashed var(--accent)", backgroundColor: "var(--accent-light)" }}
          >
            <span className="block text-3xl mb-2">🎵</span>
            <span className="block text-sm" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)", fontWeight: 500 }}>
              {musicFile ? musicFile.name : "แตะที่นี่เพื่อเลือกไฟล์เพลง"}
            </span>
            <span className="block text-xs mt-1" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
              mp3, mp4, m4a (ไม่เกิน 4MB)
            </span>
          </label>
          <label className="block text-sm" style={labelStyle}>
            ชื่อเพลง
            <input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="เว้นว่างเพื่อใช้ชื่อไฟล์" className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={labelStyle}>
            ศิลปิน (ไม่บังคับ)
            <input value={fileArtist} onChange={(e) => setFileArtist(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <button type="submit" disabled={busy || !musicFile} className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
            {busy ? "กำลังอัพโหลด..." : "อัพไฟล์เพลง"}
          </button>
        </form>
      )}
    </div>
  );
}

type CvSectionSelection = Record<AboutSection, boolean>;

const cvSectionLabels: Record<AboutSection, string> = {
  profile: "ข้อมูลส่วนตัว",
  experience: "ประสบการณ์",
  research: "ผลงานและวิจัย",
  education: "การศึกษา",
  skills: "ทักษะ",
  certifications: "ใบรับรอง",
  languages: "ภาษา",
};

function allCvSectionsSelected(): CvSectionSelection {
  return {
    profile: true,
    experience: true,
    research: true,
    education: true,
    skills: true,
    certifications: true,
    languages: true,
  };
}

function mergeSelectedCvSections(
  before: CvAboutData,
  after: CvAboutData,
  selected: CvSectionSelection
): CvAboutData {
  return {
    profile: selected.profile
      ? after.profile
      : { ...before.profile, cv: after.profile.cv },
    experience: selected.experience ? after.experience : before.experience,
    research: selected.research ? after.research : before.research,
    education: selected.education ? after.education : before.education,
    skills: selected.skills ? after.skills : before.skills,
    certifications: selected.certifications ? after.certifications : before.certifications,
    languages: selected.languages ? after.languages : before.languages,
  };
}

function cvSectionLines(data: CvAboutData, section: AboutSection): string[] {
  if (section === "profile") {
    const privacy = data.profile.privacy ?? {
      showLocation: true,
      showPhone: true,
      showEmail: true,
    };
    return [
      `ชื่อ: ${data.profile.name}`,
      `ชื่อเล่น: ${data.profile.nickname}`,
      `ที่อยู่: ${data.profile.location}`,
      `โทรศัพท์: ${data.profile.phone}`,
      `อีเมล: ${data.profile.email}`,
      `LinkedIn: ${data.profile.linkedin}`,
      `GitHub: ${data.profile.github ?? ""}`,
      `เว็บไซต์: ${data.profile.website ?? ""}`,
      `แสดงสาธารณะ: ${[
        privacy.showLocation ? "ที่อยู่" : "",
        privacy.showPhone ? "โทรศัพท์" : "",
        privacy.showEmail ? "อีเมล" : "",
      ].filter(Boolean).join(", ") || "ไม่แสดงข้อมูลติดต่อ"}`,
      `Summary: ${data.profile.summary}`,
    ];
  }
  if (section === "experience") {
    return data.experience.map((item) => `${item.year} · ${item.role} @ ${item.company}`);
  }
  if (section === "research") {
    return data.research.map((item) => `${item.year} · ${item.title} (${item.type})`);
  }
  if (section === "education") {
    return data.education.map((item) => `${item.year} · ${item.degree} @ ${item.school}`);
  }
  if (section === "skills") {
    return data.skills.map((item) => `${item.category}: ${item.items.join(", ")}`);
  }
  if (section === "certifications") return data.certifications;
  return data.languages.map((item) => `${item.lang}: ${item.level}`);
}

function CvChangesPreview({
  before,
  after,
  selected,
  onSelectionChange,
}: {
  before: CvAboutData;
  after: CvAboutData;
  selected: CvSectionSelection;
  onSelectionChange: (selected: CvSectionSelection) => void;
}) {
  const sections = Object.keys(cvSectionLabels) as AboutSection[];

  return (
    <div className="rounded-2xl p-4 sm:p-5 space-y-3" style={card}>
      <div>
        <p className="text-base" style={{ color: "var(--ink)", fontWeight: 600 }}>เลือกส่วนที่จะอัปเดต</p>
        <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
          เอาเครื่องหมายออกเพื่อเก็บข้อมูลบนเว็บไซต์ส่วนเดิมไว้
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
          แถบแดงคือข้อมูลเดิมที่จะหายไป · แถบเขียวคือข้อมูลใหม่จาก CV
        </p>
      </div>
      {sections.map((section) => {
        const oldLines = cvSectionLines(before, section);
        const newLines = cvSectionLines(after, section);
        const changed = JSON.stringify(before[section]) !== JSON.stringify(after[section]);
        return (
          <details key={section} className="rounded-xl p-3" style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border)" }}>
            <summary className="cursor-pointer list-none">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected[section]}
                  onChange={(event) => onSelectionChange({ ...selected, [section]: event.target.checked })}
                  onClick={(event) => event.stopPropagation()}
                />
                <span className="text-sm flex-1" style={{ color: "var(--ink)", fontWeight: 500 }}>
                  {cvSectionLabels[section]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  backgroundColor: changed ? "#fff5dc" : "var(--accent-light)",
                  color: changed ? "#765b20" : "var(--accent)",
                }}>
                  {changed ? "มีการเปลี่ยนแปลง" : "เหมือนเดิม"}
                </span>
              </label>
            </summary>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {([
                ["ก่อน", oldLines, new Set(newLines), "#fff0ed"],
                ["หลังอ่าน CV", newLines, new Set(oldLines), "#eef8ed"],
              ] as Array<[string, string[], Set<string>, string]>).map(([label, lines, comparison, highlight]) => (
                <div key={label} className="rounded-xl p-3" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
                  <p className="text-xs mb-2" style={{ color: "var(--accent)", fontWeight: 600 }}>{label}</p>
                  <ul className="space-y-1">
                    {lines.slice(0, 8).map((line, index) => (
                      <li
                        key={`${index}-${line}`}
                        className="text-xs break-words rounded px-1.5 py-0.5"
                        style={{
                          color: "var(--ink-light)",
                          backgroundColor: comparison.has(line) ? "transparent" : highlight,
                        }}
                      >
                        {line || "—"}
                      </li>
                    ))}
                    {lines.length > 8 && (
                      <li className="text-xs" style={{ color: "var(--accent)" }}>
                        + อีก {lines.length - 8} รายการ
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function CvForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CvPreview | null>(null);
  const [selected, setSelected] = useState<CvSectionSelection>(allCvSectionsSelected);
  const [busy, setBusy] = useState<"preview" | "publish" | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  useUnsavedWarning(Boolean(file || preview));

  async function analyze() {
    if (!file) return;
    setBusy("preview");
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    form.append("mode", "preview");
    const res = await fetch("/api/admin/cv", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) {
      setPreview(data as CvPreview);
      setSelected(allCvSectionsSelected());
      setStatus({
        ok: true,
        text: data.usedOcr
          ? `อ่านข้อความด้วย OCR สำเร็จ ${data.totalPages} หน้า กรุณาตรวจทุกส่วนก่อนบันทึก`
          : `อ่านข้อความสำเร็จ ${data.totalPages} หน้า ตรวจและแก้ข้อมูลด้านล่างก่อนบันทึก`,
      });
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  async function publish() {
    if (!file || !preview) return;
    setBusy("publish");
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    form.append("mode", "publish");
    form.append(
      "about",
      JSON.stringify(mergeSelectedCvSections(preview.before, preview.about, selected))
    );
    const res = await fetch("/api/admin/cv", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) {
      setStatus({
        ok: true,
        text: "อัปเดต CV และหน้า About แล้ว! เว็บจะเผยแพร่หลัง Deployment เสร็จ 🎉",
      });
      setFile(null);
      setPreview(null);
      setHistoryVersion((version) => version + 1);
    } else {
      setStatus({ ok: false, text: data.error ?? "เกิดข้อผิดพลาด" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div className="flex items-center justify-between gap-3 rounded-xl p-4" style={{ backgroundColor: "var(--cream)" }}>
          <div>
            <p className="text-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>CV ปัจจุบัน</p>
            <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>CV_Conlathit_Phuncam.pdf</p>
          </div>
          <a href="/CV_Conlathit_Phuncam.pdf" target="_blank" rel="noreferrer" className="text-xs px-3 py-2 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            เปิดดู ↗
          </a>
        </div>
        <input
          key={file?.lastModified ?? "empty"}
          id="cv-file-input"
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            setSelected(allCvSectionsSelected());
            setStatus(null);
          }}
          className="hidden"
        />
        <label htmlFor="cv-file-input" className="block rounded-2xl py-10 text-center cursor-pointer" style={{ border: "2px dashed var(--accent)", backgroundColor: "var(--accent-light)" }}>
          <span className="block text-3xl mb-2">📄</span>
          <span className="block text-sm" style={{ color: "var(--accent)", fontWeight: 500 }}>
            {file ? file.name : "เลือกไฟล์ CV ใหม่"}
          </span>
          <span className="block text-xs mt-1" style={{ color: "var(--ink-light)" }}>
            PDF ปกติไม่เกิน 12 หน้า · ไฟล์สแกน OCR ไม่เกิน 4 หน้า · สูงสุด 4MB
          </span>
        </label>
        <StatusMessage status={status} />
        <button
          type="button"
          onClick={analyze}
          disabled={busy !== null || !file}
          className="w-full py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
        >
          {busy === "preview" ? "กำลังอ่านข้อความ..." : preview ? "อ่านข้อความใหม่อีกครั้ง" : "อ่านข้อความจาก CV"}
        </button>
      </div>

      {preview && (
        <div className="space-y-4">
          {preview.usedOcr && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--accent)" }}>
              <span className="text-xl">🔎</span>
              <div>
                <p className="text-sm" style={{ color: "var(--accent)", fontWeight: 600 }}>อ่านข้อความด้วย OCR</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
                  รองรับภาษาไทยและอังกฤษ แต่ควรตรวจชื่อเฉพาะ ตัวเลข และช่วงปีเป็นพิเศษ
                </p>
              </div>
            </div>
          )}
          {preview.warnings.length > 0 && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: "#fff5dc", border: "1px solid #e6cf98" }}>
              <p className="text-sm mb-2" style={{ color: "#765b20", fontWeight: 600 }}>จุดที่ควรตรวจเอง</p>
              <ul className="space-y-1">
                {preview.warnings.map((warning) => (
                  <li key={warning} className="text-xs" style={{ color: "#765b20" }}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <CvChangesPreview
            before={preview.before}
            after={preview.about}
            selected={selected}
            onSelectionChange={setSelected}
          />

          <CvReviewEditor
            value={preview.about}
            selected={selected}
            onChange={(about) => setPreview((current) => current ? { ...current, about } : current)}
          />

          <details className="rounded-2xl p-4" style={card}>
            <summary className="text-sm cursor-pointer" style={{ color: "var(--accent)", fontWeight: 500 }}>
              ดูข้อความที่อ่านจาก PDF
            </summary>
            <pre className="mt-4 text-xs whitespace-pre-wrap max-h-80 overflow-auto" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
              {preview.rawText}
            </pre>
          </details>

          <button
            type="button"
            onClick={publish}
            disabled={busy !== null}
            className="w-full py-3 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--ink)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)", fontWeight: 600 }}
          >
            {busy === "publish"
              ? "กำลังบันทึก CV และ About..."
              : `ยืนยัน อัปเดต CV และ ${Object.values(selected).filter(Boolean).length} ส่วน`}
          </button>
        </div>
      )}

      <CvVersionHistory
        key={historyVersion}
        onRestored={(text) => {
          setStatus({ ok: true, text });
          setHistoryVersion((version) => version + 1);
        }}
      />
    </div>
  );
}

function CvVersionHistory({ onRestored }: { onRestored: (message: string) => void }) {
  const [history, setHistory] = useState<CvHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySha, setBusySha] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/cv/history")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "โหลดประวัติไม่สำเร็จ");
        setHistory(Array.isArray(data.history) ? data.history : []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "โหลดประวัติไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  async function restore(item: CvHistoryItem) {
    if (!confirm(`ย้อน CV และหน้า About กลับไปเวอร์ชัน "${item.message}" หรือไม่?`)) return;
    setBusySha(item.sha);
    setError("");
    const response = await fetch("/api/admin/cv/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: item.sha }),
    });
    const data = await response.json().catch(() => ({}));
    setBusySha("");
    if (!response.ok) {
      setError(data.error ?? "ย้อนกลับไม่สำเร็จ");
      return;
    }
    onRestored("ย้อน CV และหน้า About แล้ว เว็บจะอัปเดตหลัง Deployment เสร็จ");
  }

  return (
    <details className="rounded-2xl p-4 sm:p-5" style={card}>
      <summary className="text-sm cursor-pointer" style={{ color: "var(--accent)", fontWeight: 600 }}>
        ประวัติเวอร์ชันและย้อนกลับ
      </summary>
      <div className="mt-4 space-y-2">
        {loading && <p className="text-xs" style={{ color: "var(--ink-light)" }}>กำลังโหลดประวัติ...</p>}
        {error && <p className="text-xs" style={{ color: "#b3553a" }}>{error}</p>}
        {!loading && !error && history.length === 0 && (
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>ยังไม่มีประวัติเวอร์ชัน</p>
        )}
        {history.map((item, index) => (
          <div key={item.sha} className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border)" }}>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--ink)" }}>
                {index === 0 ? "ปัจจุบัน · " : ""}{item.message}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
                {item.date ? new Date(item.date).toLocaleString("th-TH") : item.sha.slice(0, 7)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                  ดู
                </a>
              )}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => restore(item)}
                  disabled={Boolean(busySha)}
                  className="text-xs px-3 py-1.5 rounded-full disabled:opacity-40"
                  style={{ backgroundColor: "var(--ink)", color: "#fff" }}
                >
                  {busySha === item.sha ? "กำลังย้อน..." : "ย้อนกลับ"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

type AboutData = CvAboutData;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function CvDraftList<T>({
  items,
  onChange,
  emptyItem,
  renderEditor,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  emptyItem: T;
  renderEditor: (item: T, onItemChange: (item: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl p-4 space-y-3" style={card}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>รายการที่ {index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: "#f5e0d8", color: "#b3553a" }}
            >
              ลบ
            </button>
          </div>
          {renderEditor(item, (updated) => {
            const next = [...items];
            next[index] = updated;
            onChange(next);
          })}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, cloneValue(emptyItem)])}
        className="w-full py-2 rounded-full text-sm"
        style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
      >
        + เพิ่มรายการ
      </button>
    </div>
  );
}

function CvReviewEditor({
  value,
  selected,
  onChange,
}: {
  value: AboutData;
  selected: CvSectionSelection;
  onChange: (value: AboutData) => void;
}) {
  const [section, setSection] = useState<AboutSection>("profile");
  const sections: Array<[AboutSection, string, number | null]> = [
    ["profile", "ข้อมูลส่วนตัว", null],
    ["experience", "ประสบการณ์", value.experience.length],
    ["research", "ผลงาน", value.research.length],
    ["education", "การศึกษา", value.education.length],
    ["skills", "ทักษะ", value.skills.length],
    ["certifications", "ใบรับรอง", value.certifications.length],
    ["languages", "ภาษา", value.languages.length],
  ];

  function setProfile(patch: Partial<AboutData["profile"]>) {
    onChange({ ...value, profile: { ...value.profile, ...patch } });
  }

  type CvProfileTextKey = Exclude<keyof AboutData["profile"], "privacy">;
  const profileFields: Array<[
    CvProfileTextKey,
    string,
    string?
  ]> = [
    ["name", "ชื่อ"],
    ["nickname", "ชื่อเล่น"],
    ["location", "ที่อยู่"],
    ["phone", "โทรศัพท์"],
    ["email", "อีเมล", "email"],
    ["linkedin", "LinkedIn URL", "url"],
    ["github", "GitHub URL", "url"],
    ["website", "เว็บไซต์", "url"],
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ ...card, border: "1px solid var(--accent)" }}>
      <div>
        <p className="text-base" style={{ color: "var(--ink)", fontWeight: 600 }}>ตรวจและแก้ข้อมูลก่อนเผยแพร่</p>
        <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
          ข้อมูลทุกช่องแก้เองได้ ระบบจะยังไม่เปลี่ยนหน้าเว็บจนกว่าจะกดยืนยันด้านล่าง
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className="text-xs px-3 py-2 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: section === key ? "var(--accent)" : "var(--accent-light)",
              color: section === key ? "#fff" : "var(--accent)",
            }}
          >
            {selected[key] ? "✓ " : "– "}{label}{count === null ? "" : ` (${count})`}
          </button>
        ))}
      </div>

      {!selected[section] && (
        <p className="text-xs rounded-xl px-3 py-2" style={{ backgroundColor: "#fff5dc", color: "#765b20" }}>
          ส่วนนี้ไม่ได้ถูกเลือก ข้อมูลที่แก้ในส่วนนี้จะไม่ถูกบันทึกจนกว่าจะเลือกด้านบน
        </p>
      )}

      {section === "profile" && (
        <div className="space-y-3">
          {profileFields.map(([key, label, type]) => (
            <label key={key} className="block text-xs" style={labelStyle}>
              {label}
              <input
                type={type ?? "text"}
                value={String(value.profile[key] ?? "")}
                onChange={(event) => setProfile({ [key]: event.target.value })}
                className="mt-1 w-full rounded-xl px-3 py-2 outline-none text-sm"
                style={inputStyle}
              />
            </label>
          ))}
          <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--ink)", fontWeight: 600 }}>ข้อมูลที่แสดงบนหน้าสาธารณะ</p>
            {([
              ["showLocation", "แสดงที่อยู่"],
              ["showPhone", "แสดงเบอร์โทร"],
              ["showEmail", "แสดงอีเมล"],
            ] as Array<[keyof NonNullable<AboutData["profile"]["privacy"]>, string]>).map(([key, label]) => {
              const privacy = value.profile.privacy ?? {
                showLocation: true,
                showPhone: true,
                showEmail: true,
              };
              return (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--ink-light)" }}>
                  <input
                    type="checkbox"
                    checked={privacy[key]}
                    onChange={(event) => setProfile({
                      privacy: { ...privacy, [key]: event.target.checked },
                    })}
                  />
                  {label}
                </label>
              );
            })}
          </div>
          <label className="block text-xs" style={labelStyle}>
            Summary
            <textarea
              value={value.profile.summary}
              onChange={(event) => setProfile({ summary: event.target.value })}
              rows={6}
              className="mt-1 w-full rounded-xl px-3 py-2 outline-none text-sm resize-y"
              style={inputStyle}
            />
          </label>
        </div>
      )}

      {section === "experience" && (
        <CvDraftList
          items={value.experience}
          onChange={(experience) => onChange({ ...value, experience })}
          emptyItem={{ year: "", role: "", company: "", items: [] }}
          renderEditor={(item, update) => <ExperienceEditor item={item} onChange={update} />}
        />
      )}
      {section === "research" && (
        <CvDraftList
          items={value.research}
          onChange={(research) => onChange({ ...value, research })}
          emptyItem={{ year: "", title: "", type: "", items: [] }}
          renderEditor={(item, update) => <ResearchEditor item={item} onChange={update} />}
        />
      )}
      {section === "education" && (
        <CvDraftList
          items={value.education}
          onChange={(education) => onChange({ ...value, education })}
          emptyItem={{ year: "", degree: "", school: "" }}
          renderEditor={(item, update) => <EducationEditor item={item} onChange={update} />}
        />
      )}
      {section === "skills" && (
        <CvDraftList
          items={value.skills}
          onChange={(skills) => onChange({ ...value, skills })}
          emptyItem={{ category: "", items: [] }}
          renderEditor={(item, update) => <SkillEditor item={item} onChange={update} />}
        />
      )}
      {section === "certifications" && (
        <ItemsEditor
          items={value.certifications}
          onChange={(certifications) => onChange({ ...value, certifications })}
          placeholder="ชื่อใบรับรอง"
        />
      )}
      {section === "languages" && (
        <CvDraftList
          items={value.languages}
          onChange={(languages) => onChange({ ...value, languages })}
          emptyItem={{ lang: "", level: "" }}
          renderEditor={(item, update) => <LanguageEditor item={item} onChange={update} />}
        />
      )}
    </div>
  );
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

  const sections: [AboutSection, string, string][] = [
    ["profile", "👤 ข้อมูลส่วนตัว", "ชื่อ ช่องทางติดต่อ และคำแนะนำตัว"],
    ["experience", "💼 ประสบการณ์", `${data.experience.length} รายการ`],
    ["research", "🔬 ผลงานและวิจัย", `${data.research.length} รายการ`],
    ["education", "🎓 การศึกษา", `${data.education.length} รายการ`],
    ["skills", "🛠️ ทักษะ", `${data.skills.length} หมวด`],
    ["certifications", "📜 ใบรับรอง", `${data.certifications.length} รายการ`],
    ["languages", "🌏 ภาษา", `${data.languages.length} ภาษา`],
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/about" target="_blank" className="text-xs px-3 py-2 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          เปิดหน้า About ↗
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sections.map(([s, label, detail]) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className="text-left rounded-xl px-4 py-3 transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              backgroundColor: section === s ? "var(--ink)" : "var(--accent-light)",
              color: section === s ? "#fff" : "var(--accent)",
            }}
          >
            <span className="block text-sm" style={{ fontWeight: 500 }}>{label}</span>
            <span className="block text-xs mt-1" style={{ color: section === s ? "#e8ddd0" : "var(--ink-light)" }}>{detail}</span>
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
  useUnsavedWarning(JSON.stringify(profile) !== JSON.stringify(data.profile));

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

  type ProfileTextKey = Exclude<keyof typeof profile, "privacy">;
  const fields: Array<[ProfileTextKey, string, string?]> = [
    ["name", "ชื่อ"],
    ["nickname", "ชื่อเล่น"],
    ["location", "ที่อยู่"],
    ["phone", "โทรศัพท์"],
    ["email", "อีเมล", "email"],
    ["linkedin", "LinkedIn URL"],
    ["github", "GitHub URL"],
    ["website", "เว็บไซต์"],
    ["cv", "ชื่อไฟล์ CV"],
  ];

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 space-y-3" style={card}>
      {fields.map(([key, label, type]) => (
        <label key={key} className="block text-sm" style={labelStyle}>
          {label}
          <input
            type={type ?? "text"}
            value={String(profile[key] ?? "")}
            onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
            className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
            style={inputStyle}
          />
        </label>
      ))}
      <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--ink)", fontWeight: 600 }}>ความเป็นส่วนตัวบนหน้า About</p>
        {([
          ["showLocation", "แสดงที่อยู่"],
          ["showPhone", "แสดงเบอร์โทร"],
          ["showEmail", "แสดงอีเมล"],
        ] as Array<[keyof NonNullable<AboutData["profile"]["privacy"]>, string]>).map(([key, label]) => {
          const privacy = profile.privacy ?? {
            showLocation: true,
            showPhone: true,
            showEmail: true,
          };
          return (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer" style={labelStyle}>
              <input
                type="checkbox"
                checked={privacy[key]}
                onChange={(event) => setProfile({
                  ...profile,
                  privacy: { ...privacy, [key]: event.target.checked },
                })}
              />
              {label}
            </label>
          );
        })}
      </div>
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
              onClick={() => save([newItem, ...items])}
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

// ช่องไฟล์แนบ — พิมพ์ชื่อไฟล์เอง หรือกดปุ่มอัพไฟล์จริงขึ้น GitHub แล้วใส่ชื่อให้อัตโนมัติ
function FileField({ label, value, accept, onChange }: {
  label: string;
  value: string;
  accept: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputId = `file-field-${label.replace(/\W/g, "")}`;

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกิน 4MB");
      return;
    }
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", f);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) onChange(data.filename);
    else setError(data.error ?? "อัพโหลดไม่สำเร็จ");
  }

  return (
    <div>
      <label className="block text-xs" style={labelStyle}>
        {label}
        <div className="flex gap-2 mt-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ยังไม่มีไฟล์"
            className="flex-1 rounded-xl px-3 py-1.5 outline-none text-sm min-w-0"
            style={inputStyle}
          />
          <input id={inputId} type="file" accept={accept} onChange={upload} className="hidden" />
          <label
            htmlFor={inputId}
            className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-opacity hover:opacity-80 shrink-0 flex items-center"
            style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
          >
            {uploading ? "กำลังอัพ..." : "📎 อัพไฟล์"}
          </label>
        </div>
      </label>
      {error && <p className="text-xs mt-1" style={{ color: "#b3553a", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{error}</p>}
    </div>
  );
}

function ResearchEditor({ item, onChange }: { item: AboutData["research"][0]; onChange: (item: AboutData["research"][0]) => void }) {
  return (
    <div className="space-y-2">
      {(["year", "title", "type"] as const).map((key) => (
        <label key={key} className="block text-xs" style={labelStyle}>
          {key}
          <input value={item[key] ?? ""} onChange={(e) => onChange({ ...item, [key]: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-1.5 outline-none text-sm" style={inputStyle} />
        </label>
      ))}
      <FileField
        label="pdf (เอกสารโปรเจค)"
        value={item.pdf ?? ""}
        accept="application/pdf"
        onChange={(v) => onChange({ ...item, pdf: v })}
      />
      <FileField
        label="image (รูปประกอบ)"
        value={item.image ?? ""}
        accept="image/*"
        onChange={(v) => onChange({ ...item, image: v })}
      />
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

function CurrentlyEditor() {
  const [data, setData] = useState<CurrentlyData>({ updatedAt: "", items: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/currently")
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "โหลด Currently ไม่สำเร็จ");
        setData(result as CurrentlyData);
      })
      .catch((error) => setStatus({ ok: false, text: error instanceof Error ? error.message : "โหลด Currently ไม่สำเร็จ" }))
      .finally(() => setLoading(false));
  }, []);

  function updateItem(index: number, patch: Partial<CurrentlyItem>) {
    setData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function addItem() {
    setData((current) => ({
      ...current,
      items: [...current.items, { id: `item-${Date.now()}`, label: "กำลัง...", emoji: "✨", title: "", detail: "" }],
    }));
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/admin/currently", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    setStatus(response.ok
      ? { ok: true, text: "บันทึก Currently แล้ว เว็บจะอัปเดตหลัง Deployment เสร็จ 🎉" }
      : { ok: false, text: result.error ?? "บันทึก Currently ไม่สำเร็จ" });
  }

  if (loading) return <p style={{ color: "var(--ink-light)" }}>กำลังโหลด Currently...</p>;

  return (
    <div className="space-y-4">
      {data.items.map((item, index) => (
        <div key={item.id} className="rounded-2xl p-5 space-y-3" style={card}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>การ์ดที่ {index + 1}</span>
            <button type="button" onClick={() => setData((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "#f5e0d8", color: "#b3553a" }}>
              ลบ
            </button>
          </div>
          <div className="grid sm:grid-cols-[1fr_3fr] gap-3">
            <label className="block text-sm" style={labelStyle}>ป้ายกำกับ<input value={item.label} onChange={(event) => updateItem(index, { label: event.target.value })} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} /></label>
            <label className="block text-sm" style={labelStyle}>หัวข้อ<input value={item.title} onChange={(event) => updateItem(index, { title: event.target.value })} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} /></label>
          </div>
          <div className="grid sm:grid-cols-[4rem_1fr] gap-3">
            <label className="block text-sm" style={labelStyle}>Emoji<input value={item.emoji} onChange={(event) => updateItem(index, { emoji: event.target.value })} className="mt-1 w-full rounded-xl px-3 py-2 outline-none text-center" style={inputStyle} /></label>
            <label className="block text-sm" style={labelStyle}>รายละเอียด<textarea value={item.detail} onChange={(event) => updateItem(index, { detail: event.target.value })} rows={2} className="mt-1 w-full rounded-xl px-3 py-2 outline-none resize-y" style={inputStyle} /></label>
          </div>
          <label className="block text-sm" style={labelStyle}>ลิงก์ (ไม่บังคับ)<input value={item.href ?? ""} onChange={(event) => updateItem(index, { href: event.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} /></label>
        </div>
      ))}
      <div className="grid sm:grid-cols-2 gap-2">
        <button type="button" onClick={addItem} disabled={data.items.length >= 12} className="py-2.5 rounded-full text-sm disabled:opacity-40" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>+ เพิ่มการ์ด</button>
        <button type="button" onClick={save} disabled={busy} className="py-2.5 rounded-full text-sm disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>{busy ? "กำลังบันทึก..." : "บันทึก Currently"}</button>
      </div>
      <StatusMessage status={status} />
    </div>
  );
}
