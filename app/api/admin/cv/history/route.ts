import { isLoggedIn } from "@/lib/admin/auth";
import {
  commitFiles,
  getFileHistory,
  isConfigured,
  readFileAtRef,
  readFileBase64AtRef,
} from "@/lib/admin/github";
import { rejectCrossOrigin } from "@/lib/admin/security";

export const runtime = "nodejs";

const CV_PATH = "public/CV_Conlathit_Phuncam.pdf";
const ABOUT_PATH = "content/about.json";

export async function GET() {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json({ error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN" }, { status: 500 });
  }

  try {
    const history = await getFileHistory(ABOUT_PATH, 10);
    return Response.json({ history });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "โหลดประวัติไม่สำเร็จ" },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json({ error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const sha = typeof body?.sha === "string" ? body.sha.trim() : "";
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    return Response.json({ error: "Commit ที่เลือกไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const [aboutContent, cvBase64] = await Promise.all([
      readFileAtRef(ABOUT_PATH, sha),
      readFileBase64AtRef(CV_PATH, sha),
    ]);
    if (!aboutContent || !cvBase64) {
      return Response.json(
        { error: "เวอร์ชันนี้ไม่มีข้อมูล CV และ About ครบทั้งสองไฟล์" },
        { status: 422 }
      );
    }

    JSON.parse(aboutContent);
    const commitSha = await commitFiles(
      [
        { path: ABOUT_PATH, content: aboutContent, encoding: "utf-8" },
        { path: CV_PATH, content: cvBase64, encoding: "base64" },
      ],
      `Restore CV and About from ${sha.slice(0, 7)}`
    );
    return Response.json({ ok: true, commitSha });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "ย้อนกลับเวอร์ชันไม่สำเร็จ" },
      { status: 502 }
    );
  }
}
