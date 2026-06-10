import { verifyPassword, setSession, clearSession, isLoggedIn } from "@/lib/admin/auth";

export async function GET() {
  return Response.json({ loggedIn: await isLoggedIn() });
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า ADMIN_PASSWORD ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !verifyPassword(password)) {
    return Response.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  await setSession();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await clearSession();
  return Response.json({ ok: true });
}
