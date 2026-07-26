import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, deleteFile, readFile, listFiles } from "@/lib/admin/github";
import { rejectCrossOrigin } from "@/lib/admin/security";
import { hasFileSignature } from "@/lib/admin/file-validation";

function bangkokToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
}

function makeFilename(originalName: string): string {
  const ext = /\.(png|webp|gif|avif)$/i.exec(originalName)?.[1]?.toLowerCase() ?? "jpg";
  const stamp = new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  return `photo-${stamp}-${rand}.${ext}`;
}

type GalleryMeta = Record<string, {
  caption?: string;
  date?: string;
  location?: string;
  featured?: boolean;
}>;

async function readGalleryMeta(): Promise<GalleryMeta> {
  const metaRaw = await readFile("content/gallery.json");
  try {
    return metaRaw ? (JSON.parse(metaRaw) as GalleryMeta) : {};
  } catch {
    return {};
  }
}

// GET — list all photos
export async function GET() {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }

  try {
    const [meta, files] = await Promise.all([
      readGalleryMeta(),
      listFiles("public/gallery"),
    ]);

    // รวมรายการจาก gallery.json และ public/gallery/
    const allFilenames = Array.from(
      new Set([...Object.keys(meta), ...files.filter((f) => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f))])
    );

    const photos = allFilenames.map((filename) => ({
      filename,
      caption: meta[filename]?.caption ?? "",
      location: meta[filename]?.location ?? "",
      date: meta[filename]?.date ?? "",
      featured: meta[filename]?.featured === true,
    }));

    return Response.json({ photos });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 502 });
  }
}

// POST — upload new photo
export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File) || file.size === 0) {
    return Response.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
  }
  if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)) {
    return Response.json({ error: "รองรับเฉพาะ jpg, png, webp, gif และ avif" }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: "ไฟล์ใหญ่เกิน 4MB" }, { status: 413 });
  }
  if (!(await hasFileSignature(file, "image"))) {
    return Response.json({ error: "ไฟล์รูปไม่ถูกต้อง" }, { status: 400 });
  }

  const caption = String(form.get("caption") ?? "").trim();
  const location = String(form.get("location") ?? "").trim();
  const date = String(form.get("date") ?? "").trim() || bangkokToday();

  const filename = makeFilename(file.name);
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  // อ่าน gallery.json ปัจจุบันจาก GitHub แล้วเพิ่ม entry ใหม่
  const meta = await readGalleryMeta();
  meta[filename] = {
    ...(caption ? { caption } : {}),
    date,
    ...(location ? { location } : {}),
  };

  try {
    await commitFiles(
      [
        { path: `public/gallery/${filename}`, content: base64, encoding: "base64" },
        { path: "content/gallery.json", content: JSON.stringify(meta, null, 2) + "\n", encoding: "utf-8" },
      ],
      `New gallery photo: ${caption || filename}`
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "commit ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true, filename });
}

// PATCH — update photo metadata
export async function PATCH(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const filename = (body?.filename ?? "").trim();
  if (!filename) {
    return Response.json({ error: "ต้องระบุชื่อไฟล์รูป" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9._-]{0,119}\.(?:jpe?g|png|webp|gif|avif)$/i.test(filename)) {
    return Response.json({ error: "ชื่อไฟล์รูปไม่ถูกต้อง" }, { status: 400 });
  }

  const caption = String(body?.caption ?? "").trim();
  const location = String(body?.location ?? "").trim();
  const date = String(body?.date ?? "").trim() || bangkokToday();
  const featured = body?.featured === true;

  const meta = await readGalleryMeta();
  if (featured) {
    for (const key of Object.keys(meta)) {
      if (key !== filename && meta[key]?.featured) meta[key] = { ...meta[key], featured: false };
    }
  }
  meta[filename] = {
    ...(caption ? { caption } : {}),
    date,
    ...(location ? { location } : {}),
    ...(featured ? { featured: true } : {}),
  };

  try {
    await commitFiles(
      [{ path: "content/gallery.json", content: JSON.stringify(meta, null, 2) + "\n", encoding: "utf-8" }],
      `Update photo metadata: ${filename}`
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "commit ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true });
}

// DELETE — delete photo and remove from gallery.json
export async function DELETE(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const filename = (body?.filename ?? "").trim();
  if (!filename) {
    return Response.json({ error: "ต้องระบุชื่อไฟล์รูป" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9._-]{0,119}\.(?:jpe?g|png|webp|gif|avif)$/i.test(filename)) {
    return Response.json({ error: "ชื่อไฟล์รูปไม่ถูกต้อง" }, { status: 400 });
  }

  // อ่าน gallery.json แล้วลบ entry
  const meta = await readGalleryMeta();
  delete meta[filename];
  const updatedMeta = JSON.stringify(meta, null, 2) + "\n";

  try {
    // ลบไฟล์รูปและอัพเดต gallery.json ใน commit เดียว
    // ต้องทำแยกกันเพราะ deleteFile ใช้ Contents API แต่ commitFiles ใช้ Git Data API
    await deleteFile(`public/gallery/${filename}`, `Delete gallery photo: ${filename}`);
    await commitFiles(
      [{ path: "content/gallery.json", content: updatedMeta, encoding: "utf-8" }],
      `Remove gallery entry: ${filename}`
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "ลบรูปไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
