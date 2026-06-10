import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, readFile } from "@/lib/admin/github";

const ABOUT_PATH = "content/about.json";

// GET — return about.json data
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
    const raw = await readFile(ABOUT_PATH);
    if (!raw) {
      return Response.json({ error: "ไม่พบไฟล์ about.json" }, { status: 404 });
    }
    const data = JSON.parse(raw);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 502 });
  }
}

// PUT — write updated data back to about.json
export async function PUT(request: Request) {
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
  if (!body || typeof body !== "object") {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  // ตรวจสอบโครงสร้างพื้นฐาน
  const requiredKeys = ["profile", "experience", "research", "education", "skills", "certifications", "languages"];
  for (const key of requiredKeys) {
    if (!(key in body)) {
      return Response.json({ error: `ข้อมูลขาดส่วน: ${key}` }, { status: 400 });
    }
  }

  if (typeof body.profile !== "object" || Array.isArray(body.profile)) {
    return Response.json({ error: "profile ต้องเป็น object" }, { status: 400 });
  }
  if (!Array.isArray(body.experience)) {
    return Response.json({ error: "experience ต้องเป็น array" }, { status: 400 });
  }
  if (!Array.isArray(body.research)) {
    return Response.json({ error: "research ต้องเป็น array" }, { status: 400 });
  }
  if (!Array.isArray(body.education)) {
    return Response.json({ error: "education ต้องเป็น array" }, { status: 400 });
  }
  if (!Array.isArray(body.skills)) {
    return Response.json({ error: "skills ต้องเป็น array" }, { status: 400 });
  }
  if (!Array.isArray(body.certifications)) {
    return Response.json({ error: "certifications ต้องเป็น array" }, { status: 400 });
  }
  if (!Array.isArray(body.languages)) {
    return Response.json({ error: "languages ต้องเป็น array" }, { status: 400 });
  }

  const content = JSON.stringify(body, null, 2) + "\n";

  try {
    await commitFiles(
      [{ path: ABOUT_PATH, content, encoding: "utf-8" }],
      "Update about.json"
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "commit ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
