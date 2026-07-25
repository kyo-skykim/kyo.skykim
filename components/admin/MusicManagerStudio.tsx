"use client";

import { useCallback, useEffect, useState } from "react";

interface MusicTrack {
  type: "youtube" | "file";
  title: string;
  artist?: string;
  src: string;
}

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

const textStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter, Inter, sans-serif)",
  color: "var(--ink-light)",
};

function Status({ value }: { value: { ok: boolean; text: string } | null }) {
  if (!value) return null;
  return (
    <p
      className="text-sm rounded-xl px-4 py-3"
      style={{
        fontFamily: "var(--font-inter, Inter, sans-serif)",
        backgroundColor: value.ok ? "var(--accent-light)" : "#f5e0d8",
        color: value.ok ? "var(--accent)" : "#b3553a",
      }}
    >
      {value.text}
    </p>
  );
}

export default function MusicManagerStudio() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [metadataBusy, setMetadataBusy] = useState(false);
  const [mode, setMode] = useState<"youtube" | "file">("youtube");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytArtist, setYtArtist] = useState("");
  const [ytThumbnail, setYtThumbnail] = useState("");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileArtist, setFileArtist] = useState("");
  const formDirty = Boolean(ytUrl.trim() || ytTitle.trim() || ytArtist.trim() || musicFile || fileTitle.trim() || fileArtist.trim() || editingIndex !== null);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!formDirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formDirty]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/music");
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setTracks(data.tracks ?? []);
    else setStatus({ ok: false, text: data.error ?? "โหลดข้อมูลไม่สำเร็จ" });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function lookupYouTube() {
    if (!ytUrl.trim()) return;
    setMetadataBusy(true);
    setStatus(null);
    const res = await fetch(`/api/admin/music?url=${encodeURIComponent(ytUrl.trim())}`);
    const data = await res.json().catch(() => ({}));
    setMetadataBusy(false);
    if (res.ok) {
      setYtTitle(data.title ?? "");
      setYtArtist(data.artist ?? "");
      setYtThumbnail(data.thumbnail ?? "");
    } else {
      setStatus({ ok: false, text: data.error ?? "อ่านข้อมูลจาก YouTube ไม่สำเร็จ" });
    }
  }

  async function addYouTube(event: React.FormEvent) {
    event.preventDefault();
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
      setStatus({ ok: true, text: "เพิ่มเพลงแล้ว — ส่งเผยแพร่เรียบร้อย" });
      setYtUrl("");
      setYtTitle("");
      setYtArtist("");
      setYtThumbnail("");
      load();
    } else {
      setStatus({ ok: false, text: data.error ?? "เพิ่มเพลงไม่สำเร็จ" });
    }
  }

  async function addFile(event: React.FormEvent) {
    event.preventDefault();
    if (!musicFile) return;
    if (musicFile.size > 4 * 1024 * 1024) {
      setStatus({ ok: false, text: "ไฟล์ใหญ่เกิน 4MB — ลองบีบอัดหรือใช้ YouTube แทน" });
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
      setStatus({ ok: true, text: "อัปโหลดเพลงแล้ว — ส่งเผยแพร่เรียบร้อย" });
      setMusicFile(null);
      setFileTitle("");
      setFileArtist("");
      load();
    } else {
      setStatus({ ok: false, text: data.error ?? "อัปโหลดไม่สำเร็จ" });
    }
  }

  async function savePlaylist(nextTracks: MusicTrack[], message: string) {
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/admin/music", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks: nextTracks }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setTracks(data.tracks ?? nextTracks);
      setStatus({ ok: true, text: message });
      return true;
    }
    setStatus({ ok: false, text: data.error ?? "บันทึก playlist ไม่สำเร็จ" });
    return false;
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditTitle(tracks[index].title);
    setEditArtist(tracks[index].artist ?? "");
  }

  async function saveEdit(index: number) {
    const next = tracks.map((track, currentIndex) => currentIndex === index
      ? { ...track, title: editTitle.trim(), artist: editArtist.trim() || undefined }
      : track);
    if (await savePlaylist(next, "แก้ข้อมูลเพลงแล้ว")) setEditingIndex(null);
  }

  async function moveTrack(index: number, nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= tracks.length || nextIndex === index) return;
    const next = [...tracks];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    await savePlaylist(next, "จัดลำดับ playlist แล้ว");
  }

  async function deleteTrack(index: number, title: string) {
    if (!confirm(`ลบเพลง "${title}" จริงๆ หรือ?`)) return;
    setBusy(true);
    const res = await fetch("/api/admin/music", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: `ลบ "${title}" แล้ว` });
      setPreviewIndex(null);
      load();
    } else {
      setStatus({ ok: false, text: data.error ?? "ลบไม่สำเร็จ" });
    }
  }

  return (
    <div className="space-y-5">
      <Status value={status} />

      {loading ? (
        <p style={textStyle}>กำลังโหลด...</p>
      ) : (
        <div className="space-y-2">
          {tracks.length === 0 && <p style={textStyle}>ยังไม่มีเพลงใน playlist</p>}
          {tracks.map((track, index) => (
            <div
              key={`${track.src}-${index}`}
              draggable={editingIndex !== index && !busy}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveTrack(dragIndex, index);
                setDragIndex(null);
              }}
              className="rounded-2xl overflow-hidden"
              style={{ ...card, opacity: dragIndex === index ? 0.55 : 1 }}
            >
              <div className="p-4 flex items-center gap-3">
                <span className="text-sm cursor-grab shrink-0" style={{ color: "var(--ink-light)" }} aria-hidden="true">⋮⋮</span>
                {track.type === "youtube" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`https://i.ytimg.com/vi/${track.src}/mqdefault.jpg`} alt="" className="w-16 h-11 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-11 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: "var(--accent-light)" }}>🎧</div>
                )}

                {editingIndex === index ? (
                  <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-2">
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="ชื่อเพลง" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                    <input value={editArtist} onChange={(event) => setEditArtist(event.target.value)} placeholder="ศิลปิน" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
                      {index + 1}. {track.title}
                    </p>
                    <p className="text-xs truncate" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
                      {track.artist ?? "ไม่ระบุศิลปิน"} · {track.type === "youtube" ? "YouTube" : "ไฟล์เพลง"}
                    </p>
                  </div>
                )}

                <div className="flex gap-1 shrink-0">
                  {editingIndex === index ? (
                    <>
                      <button onClick={() => saveEdit(index)} disabled={busy || !editTitle.trim()} className="text-xs px-2.5 py-1.5 rounded-full disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>บันทึก</button>
                      <button onClick={() => setEditingIndex(null)} className="text-xs px-2.5 py-1.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>ยกเลิก</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setPreviewIndex(previewIndex === index ? null : index)} className="text-xs px-2.5 py-1.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                        {previewIndex === index ? "หยุด" : "ฟัง"}
                      </button>
                      <button onClick={() => startEdit(index)} className="text-xs px-2.5 py-1.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>แก้</button>
                    </>
                  )}
                </div>
              </div>

              <div className="px-4 pb-3 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <button onClick={() => moveTrack(index, index - 1)} disabled={busy || index === 0} className="text-xs w-7 h-7 rounded-full disabled:opacity-25" style={{ backgroundColor: "var(--cream)", color: "var(--ink-light)" }} aria-label="เลื่อนเพลงขึ้น">↑</button>
                  <button onClick={() => moveTrack(index, index + 1)} disabled={busy || index === tracks.length - 1} className="text-xs w-7 h-7 rounded-full disabled:opacity-25" style={{ backgroundColor: "var(--cream)", color: "var(--ink-light)" }} aria-label="เลื่อนเพลงลง">↓</button>
                </div>
                <button onClick={() => deleteTrack(index, track.title)} disabled={busy} className="text-xs px-3 py-1.5 rounded-full disabled:opacity-40" style={{ backgroundColor: "#f5e0d8", color: "#b3553a" }}>
                  ลบ
                </button>
              </div>

              {previewIndex === index && (
                <div className="px-4 pb-4">
                  {track.type === "youtube" ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${track.src}`}
                      title={`ตัวอย่าง ${track.title}`}
                      className="w-full aspect-video rounded-xl"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <audio src={`/${track.src}`} controls className="w-full" />
                  )}
                </div>
              )}
            </div>
          ))}
          {tracks.length > 1 && <p className="text-xs text-center pt-1" style={textStyle}>ลากการ์ดหรือใช้ปุ่ม ↑ ↓ เพื่อจัดลำดับ</p>}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {([["youtube", "🔗 จาก YouTube"], ["file", "📁 อัปโหลดไฟล์"]] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className="text-xs px-3 py-2 rounded-full"
            style={{
              backgroundColor: mode === value ? "var(--ink)" : "var(--accent-light)",
              color: mode === value ? "#fff" : "var(--accent)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "youtube" ? (
        <form onSubmit={addYouTube} className="rounded-2xl p-5 sm:p-6 space-y-3" style={card}>
          <label className="block text-sm" style={textStyle}>
            ลิงก์ YouTube
            <div className="flex gap-2 mt-1">
              <input value={ytUrl} onChange={(event) => { setYtUrl(event.target.value); setYtThumbnail(""); }} placeholder="https://youtu.be/..." className="flex-1 min-w-0 rounded-xl px-3 py-2 outline-none" style={inputStyle} />
              <button type="button" onClick={lookupYouTube} disabled={metadataBusy || !ytUrl.trim()} className="text-xs px-3 rounded-xl disabled:opacity-40" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                {metadataBusy ? "กำลังอ่าน..." : "ดึงข้อมูล"}
              </button>
            </div>
          </label>

          {ytThumbnail && (
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "var(--cream)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ytThumbnail} alt="" className="w-24 aspect-video rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--ink)" }}>{ytTitle}</p>
                <p className="text-xs truncate" style={{ color: "var(--ink-light)" }}>{ytArtist}</p>
              </div>
            </div>
          )}

          <label className="block text-sm" style={textStyle}>
            ชื่อเพลง
            <input value={ytTitle} onChange={(event) => setYtTitle(event.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={textStyle}>
            ศิลปิน
            <input value={ytArtist} onChange={(event) => setYtArtist(event.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <button type="submit" disabled={busy || !ytUrl.trim() || !ytTitle.trim()} className="w-full py-2.5 rounded-full text-sm disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {busy ? "กำลังเพิ่ม..." : "เพิ่มเข้า Playlist"}
          </button>
        </form>
      ) : (
        <form onSubmit={addFile} className="rounded-2xl p-5 sm:p-6 space-y-3" style={card}>
          <input
            id="music-studio-file"
            type="file"
            accept=".mp3,.mp4,.m4a,.aac,.wav,.ogg,audio/*"
            onChange={(event) => setMusicFile(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <label htmlFor="music-studio-file" className="block rounded-2xl py-8 text-center cursor-pointer" style={{ border: "2px dashed var(--accent)", backgroundColor: "var(--accent-light)" }}>
            <span className="block text-3xl mb-2">🎵</span>
            <span className="block text-sm" style={{ color: "var(--accent)", fontWeight: 500 }}>{musicFile ? musicFile.name : "เลือกไฟล์เพลง"}</span>
            <span className="block text-xs mt-1" style={textStyle}>mp3, mp4, m4a, aac, wav, ogg — ไม่เกิน 4MB</span>
          </label>
          <label className="block text-sm" style={textStyle}>
            ชื่อเพลง
            <input value={fileTitle} onChange={(event) => setFileTitle(event.target.value)} placeholder="เว้นว่างเพื่อใช้ชื่อไฟล์" className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <label className="block text-sm" style={textStyle}>
            ศิลปิน
            <input value={fileArtist} onChange={(event) => setFileArtist(event.target.value)} className="mt-1 w-full rounded-xl px-3 py-2 outline-none" style={inputStyle} />
          </label>
          <button type="submit" disabled={busy || !musicFile} className="w-full py-2.5 rounded-full text-sm disabled:opacity-40" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {busy ? "กำลังอัปโหลด..." : "อัปโหลดเข้า Playlist"}
          </button>
        </form>
      )}
    </div>
  );
}
