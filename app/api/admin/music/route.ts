import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, deleteFile, readFile } from "@/lib/admin/github";
import { rejectCrossOrigin } from "@/lib/admin/security";
import { hasFileSignature } from "@/lib/admin/file-validation";

const MUSIC_PATH = "content/music.json";

interface Track {
  type: "youtube" | "file";
  title: string;
  artist?: string;
  src: string;
}

async function readTracks(): Promise<Track[]> {
  const raw = await readFile(MUSIC_PATH);
  try {
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function tracksJson(tracks: Track[]): string {
  return JSON.stringify(tracks, null, 2) + "\n";
}

// แกะ video ID จากลิงก์ YouTube ทุกรูปแบบ (youtu.be, watch?v=, shorts, embed) หรือ ID ตรง ๆ
function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = /\/(shorts|embed)\/([\w-]{11})/.exec(u.pathname);
    if (m) return m[2];
  } catch {
    return null;
  }
  return null;
}

function notLoggedIn() {
  return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
}

function notConfigured() {
  return Response.json(
    { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
    { status: 500 }
  );
}

function isTrack(value: unknown): value is Track {
  if (!value || typeof value !== "object") return false;
  const track = value as Partial<Track>;
  return (
    (track.type === "youtube" || track.type === "file") &&
    typeof track.title === "string" &&
    track.title.trim().length > 0 &&
    typeof track.src === "string" &&
    track.src.trim().length > 0 &&
    (track.artist === undefined || typeof track.artist === "string") &&
    (track.type === "youtube"
      ? /^[\w-]{11}$/.test(track.src)
      : /^music\/[a-z0-9][a-z0-9._-]{0,119}\.(?:mp3|mp4|m4a|aac|wav|ogg)$/i.test(track.src))
  );
}

// GET — list tracks, or fetch YouTube metadata for the add form
export async function GET(request: Request) {
  if (!(await isLoggedIn())) return notLoggedIn();
  if (!isConfigured()) return notConfigured();
  try {
    const url = new URL(request.url).searchParams.get("url")?.trim();
    if (url) {
      const videoId = parseYouTubeId(url);
      if (!videoId) {
        return Response.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });
      }
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        return Response.json({ error: "อ่านข้อมูลเพลงจาก YouTube ไม่สำเร็จ" }, { status: 502 });
      }
      const metadata = await response.json();
      return Response.json({
        videoId,
        title: String(metadata.title ?? ""),
        artist: String(metadata.author_name ?? ""),
        thumbnail: String(metadata.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
      });
    }
    return Response.json({ tracks: await readTracks() });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 502 });
  }
}

// POST — add track (JSON = YouTube link, multipart = file upload)
export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) return notLoggedIn();
  if (!isConfigured()) return notConfigured();

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      // อัพไฟล์เพลง
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return Response.json({ error: "ไม่พบไฟล์เพลง" }, { status: 400 });
      }
      const extMatch = /\.(mp3|mp4|m4a|aac|wav|ogg)$/i.exec(file.name);
      if (!extMatch) {
        return Response.json({ error: "รองรับเฉพาะไฟล์ mp3, mp4, m4a, aac, wav, ogg" }, { status: 400 });
      }
      if (file.size > 4 * 1024 * 1024) {
        return Response.json(
          { error: "ไฟล์ใหญ่เกิน 4MB — ลองบีบอัดเพลงให้เล็กลง หรือใช้ลิงก์ YouTube แทน" },
          { status: 413 }
        );
      }
      if (!(await hasFileSignature(file, "audio"))) {
        return Response.json({ error: "ไฟล์เพลงไม่ถูกต้อง" }, { status: 400 });
      }

      const title = String(form.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");
      const artist = String(form.get("artist") ?? "").trim();

      const ext = extMatch[1].toLowerCase();
      const stamp = new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
        .replace(/[^0-9]/g, "")
        .slice(0, 14);
      const rand = Math.random().toString(36).slice(2, 6);
      const filename = `song-${stamp}-${rand}.${ext}`;

      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const tracks = await readTracks();
      tracks.push({ type: "file", title, ...(artist ? { artist } : {}), src: `music/${filename}` });

      await commitFiles(
        [
          { path: `public/music/${filename}`, content: base64, encoding: "base64" },
          { path: MUSIC_PATH, content: tracksJson(tracks), encoding: "utf-8" },
        ],
        `Add music file: ${title}`
      );
      return Response.json({ ok: true, title });
    }

    // เพิ่มจากลิงก์ YouTube
    const body = await request.json().catch(() => null);
    const url = String(body?.url ?? "").trim();
    const title = String(body?.title ?? "").trim();
    const artist = String(body?.artist ?? "").trim();
    if (!url || !title) {
      return Response.json({ error: "ต้องใส่ลิงก์ YouTube และชื่อเพลง" }, { status: 400 });
    }
    const videoId = parseYouTubeId(url);
    if (!videoId) {
      return Response.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });
    }

    const tracks = await readTracks();
    tracks.push({ type: "youtube", title, ...(artist ? { artist } : {}), src: videoId });

    await commitFiles(
      [{ path: MUSIC_PATH, content: tracksJson(tracks), encoding: "utf-8" }],
      `Add music from YouTube: ${title}`
    );
    return Response.json({ ok: true, title });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "เพิ่มเพลงไม่สำเร็จ" }, { status: 502 });
  }
}

// DELETE — remove track by index
export async function DELETE(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) return notLoggedIn();
  if (!isConfigured()) return notConfigured();

  const body = await request.json().catch(() => null);
  const index = Number(body?.index);
  if (!Number.isInteger(index) || index < 0) {
    return Response.json({ error: "ต้องระบุ index ของเพลง" }, { status: 400 });
  }

  try {
    const tracks = await readTracks();
    if (index >= tracks.length) {
      return Response.json({ error: "ไม่พบเพลงนี้" }, { status: 404 });
    }
    const [removed] = tracks.splice(index, 1);

    if (removed.type === "file") {
      await deleteFile(`public/${removed.src}`, `Delete music file: ${removed.title}`);
    }
    await commitFiles(
      [{ path: MUSIC_PATH, content: tracksJson(tracks), encoding: "utf-8" }],
      `Remove track: ${removed.title}`
    );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "ลบเพลงไม่สำเร็จ" }, { status: 502 });
  }
}

// PUT — edit metadata or reorder the complete playlist
export async function PUT(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) return notLoggedIn();
  if (!isConfigured()) return notConfigured();

  const body = await request.json().catch(() => null);
  const tracks = body?.tracks;
  if (!Array.isArray(tracks) || !tracks.every(isTrack)) {
    return Response.json({ error: "ข้อมูล playlist ไม่ถูกต้อง" }, { status: 400 });
  }
  if (tracks.length > 100) {
    return Response.json({ error: "playlist มีได้สูงสุด 100 เพลง" }, { status: 400 });
  }

  const normalized: Track[] = tracks.map((track: Track) => ({
    type: track.type,
    title: track.title.trim().slice(0, 160),
    ...(track.artist?.trim() ? { artist: track.artist.trim().slice(0, 160) } : {}),
    src: track.src.trim(),
  }));

  try {
    await commitFiles(
      [{ path: MUSIC_PATH, content: tracksJson(normalized), encoding: "utf-8" }],
      "Update music playlist"
    );
    return Response.json({ ok: true, tracks: normalized });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "บันทึก playlist ไม่สำเร็จ" }, { status: 502 });
  }
}
