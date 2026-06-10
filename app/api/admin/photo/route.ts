import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, readFile } from "@/lib/admin/github";

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

export async function POST(request: Request) {
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
  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: "ไฟล์ใหญ่เกิน 4MB" }, { status: 413 });
  }

  const caption = String(form.get("caption") ?? "").trim();
  const location = String(form.get("location") ?? "").trim();
  const date = String(form.get("date") ?? "").trim() || bangkokToday();

  const filename = makeFilename(file.name);
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  // อ่าน gallery.json ปัจจุบันจาก GitHub แล้วเพิ่ม entry ใหม่
  const metaRaw = await readFile("content/gallery.json");
  let meta: Record<string, unknown> = {};
  try {
    meta = metaRaw ? JSON.parse(metaRaw) : {};
  } catch {
    meta = {};
  }
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
