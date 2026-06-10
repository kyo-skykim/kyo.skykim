import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, deleteFile, readFile } from "@/lib/admin/github";

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

// GET — list tracks
export async function GET() {
  if (!(await isLoggedIn())) return notLoggedIn();
  if (!isConfigured()) return notConfigured();
  try {
    return Response.json({ tracks: await readTracks() });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 502 });
  }
}

// POST — add track (JSON = YouTube link, multipart = file upload)
export async function POST(request: Request) {
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
