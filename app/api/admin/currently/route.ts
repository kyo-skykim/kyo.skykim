import { isLoggedIn } from "@/lib/admin/auth";
import { commitFiles, isConfigured, readFile } from "@/lib/admin/github";
import { rejectCrossOrigin } from "@/lib/admin/security";

const CURRENTLY_PATH = "content/currently.json";

function validItem(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return ["id", "label", "emoji", "title", "detail"].every((key) => typeof item[key] === "string") &&
    (item.href === undefined || typeof item.href === "string");
}

function validData(value: unknown): value is { updatedAt: string; items: unknown[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return typeof data.updatedAt === "string" && Array.isArray(data.items) && data.items.length <= 12 && data.items.every(validItem);
}

export async function GET() {
  if (!(await isLoggedIn())) return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  if (!isConfigured()) return Response.json({ error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel" }, { status: 500 });
  const raw = await readFile(CURRENTLY_PATH);
  if (!raw) return Response.json({ error: "ไม่พบไฟล์ Currently" }, { status: 404 });
  try { return Response.json(JSON.parse(raw)); } catch { return Response.json({ error: "ไฟล์ Currently ไม่ถูกต้อง" }, { status: 502 }); }
}

export async function PUT(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  if (!isConfigured()) return Response.json({ error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel" }, { status: 500 });
  const body = await request.json().catch(() => null);
  if (!validData(body)) return Response.json({ error: "ข้อมูล Currently ไม่ถูกต้อง" }, { status: 400 });
  const content = JSON.stringify({ ...body, updatedAt: new Date().toISOString().slice(0, 10) }, null, 2) + "\n";
  try {
    const commitSha = await commitFiles([{ path: CURRENTLY_PATH, content, encoding: "utf-8" }], "Update currently page");
    return Response.json({ ok: true, commitSha });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "บันทึก Currently ไม่สำเร็จ" }, { status: 502 });
  }
}
