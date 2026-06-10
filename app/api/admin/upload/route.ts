import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles } from "@/lib/admin/github";

// อัพโหลดไฟล์แนบ (PDF / รูป) เข้า public/ แล้วคืน path สำหรับใส่ในช่องข้อมูล
const ALLOWED = /\.(pdf|jpe?g|png|webp|gif|avif)$/i;

function sanitizeName(name: string): string {
  const ext = ALLOWED.exec(name)?.[0].toLowerCase() ?? "";
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w฀-๿-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "file";
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}${ext}`;
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
    return Response.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }
  if (!ALLOWED.test(file.name)) {
    return Response.json({ error: "รองรับเฉพาะ PDF และรูปภาพ (jpg, png, webp, gif)" }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: "ไฟล์ใหญ่เกิน 4MB" }, { status: 413 });
  }

  const filename = sanitizeName(file.name);
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    await commitFiles(
      [{ path: `public/${filename}`, content: base64, encoding: "base64" }],
      `Upload file: ${filename}`
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "อัพโหลดไม่สำเร็จ" }, { status: 502 });
  }

  // คืนชื่อไฟล์ใน public/ — ใช้ใส่ในช่อง pdf/image ได้เลย
  return Response.json({ ok: true, filename });
}
