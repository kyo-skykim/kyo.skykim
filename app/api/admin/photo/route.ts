import { randomUUID } from "node:crypto";
import { uploadPhoto, PhotoUploadConflict, type GalleryMeta } from "@/lib/admin/photo-upload";
import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, getHeadSha, readFileAtRef, listFiles, type CommitFile } from "@/lib/admin/github";
import { rejectCrossOrigin, rejectOversizedRequest } from "@/lib/admin/security";
import { detectImageExtension, hasFileSignature } from "@/lib/admin/file-validation";

function bangkokToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
}

async function readGalleryMeta(head?: string): Promise<GalleryMeta> {
  const raw = await readFileAtRef("content/gallery.json", head ?? await getHeadSha(), true);
  const meta = raw ? JSON.parse(raw) : {};
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) throw new Error("ข้อมูลคลังรูปไม่ถูกต้อง");
  return meta;
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
  const sizeError = rejectOversizedRequest(request, 5 * 1024 * 1024);
  if (sizeError) return sizeError;
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
  const detectedExtension = await detectImageExtension(file);
  if (!detectedExtension) return Response.json({ error: "อ่านชนิดไฟล์รูปไม่สำเร็จ" }, { status: 400 });

  const caption = String(form.get("caption") ?? "").trim();
  const location = String(form.get("location") ?? "").trim();
  const date = String(form.get("date") ?? "").trim() || bangkokToday();

  const id = String(form.get("uploadId") ?? randomUUID());
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) {
    return Response.json({ error: "รหัสอัปโหลดไม่ถูกต้อง" }, { status: 400 });
  }
  try {
    const result = await uploadPhoto({ id: id.toLowerCase(), extension: detectedExtension, bytes: Buffer.from(await file.arrayBuffer()), caption, location, date });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "บันทึกรูปไม่สำเร็จ" }, { status: error instanceof PhotoUploadConflict ? 409 : 502 });
  }
}

// PATCH — update photo metadata
export async function PATCH(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 64 * 1024);
  if (sizeError) return sizeError;
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

  try {
    const head = await getHeadSha();
    const meta = await readGalleryMeta(head);
    if (featured) {
      for (const key of Object.keys(meta)) {
        if (key !== filename && meta[key]?.featured) meta[key] = { ...meta[key], featured: false };
      }
    }
    meta[filename] = {
      ...meta[filename],
      caption,
      date,
      location,
      featured,
    };

    await commitFiles(
      [{ path: "content/gallery.json", content: JSON.stringify(meta, null, 2) + "\n", encoding: "utf-8" }],
      `Update photo metadata: ${filename}`, head
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
  const sizeError = rejectOversizedRequest(request, 64 * 1024);
  if (sizeError) return sizeError;
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
  const requestedFilenames: unknown[] = Array.isArray(body?.filenames)
    ? body.filenames
    : body?.filename
      ? [body.filename]
      : [];
  const filenames = Array.from(
    new Set(requestedFilenames.map((value) => String(value).trim()).filter(Boolean))
  );
  if (filenames.length === 0) {
    return Response.json({ error: "ต้องระบุชื่อไฟล์รูป" }, { status: 400 });
  }
  if (filenames.length > 50) {
    return Response.json({ error: "ลบรูปได้ครั้งละไม่เกิน 50 รูป" }, { status: 400 });
  }
  if (filenames.some((filename) => !/^[a-z0-9][a-z0-9._-]{0,119}\.(?:jpe?g|png|webp|gif|avif)$/i.test(filename))) {
    return Response.json({ error: "ชื่อไฟล์รูปไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const head = await getHeadSha();
    const [meta, storedFiles] = await Promise.all([readGalleryMeta(head), listFiles("public/gallery")]);
    for (const filename of filenames) delete meta[filename];

    const stored = new Set(storedFiles);
    const changes: CommitFile[] = filenames
      .filter((filename) => stored.has(filename))
      .map((filename) => ({ path: `public/gallery/${filename}`, delete: true }));
    changes.push({
      path: "content/gallery.json",
      content: JSON.stringify(meta, null, 2) + "\n",
      encoding: "utf-8",
    });

    await commitFiles(changes, filenames.length === 1
      ? `Delete gallery photo: ${filenames[0]}`
      : `Delete ${filenames.length} gallery photos`, head);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "ลบรูปไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true, deleted: filenames.length });
}
