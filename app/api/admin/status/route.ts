import { isLoggedIn } from "@/lib/admin/auth";
import { getPublishStatus, isConfigured } from "@/lib/admin/github";

export async function GET() {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel" },
      { status: 500 }
    );
  }

  try {
    return Response.json(await getPublishStatus());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "ตรวจสถานะเผยแพร่ไม่สำเร็จ" },
      { status: 502 }
    );
  }
}
