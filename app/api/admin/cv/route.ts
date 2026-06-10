import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles } from "@/lib/admin/github";

// ชื่อไฟล์ CV ต้องตรงกับ profile.cv ใน content/about.ts
const CV_PATH = "public/CV_Conlathit_Phuncam.pdf";

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
    return Response.json({ error: "ไม่พบไฟล์ PDF" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return Response.json({ error: "ต้องเป็นไฟล์ PDF เท่านั้น" }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: "ไฟล์ใหญ่เกิน 4MB" }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    await commitFiles(
      [{ path: CV_PATH, content: base64, encoding: "base64" }],
      "Update CV"
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "commit ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
