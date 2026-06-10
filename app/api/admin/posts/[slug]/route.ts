import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, readFile } from "@/lib/admin/github";
import matter from "gray-matter";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }

  const { slug } = await params;
  const raw = await readFile(`content/diary/${slug}.md`);
  if (!raw) {
    return Response.json({ error: "ไม่พบโพสต์นี้" }, { status: 404 });
  }

  const { data, content } = matter(raw);

  return Response.json({
    slug,
    title: (data.title ?? slug) as string,
    date: (data.date ?? "") as string,
    excerpt: (data.excerpt ?? "") as string,
    mood: (data.mood ?? "😊") as string,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    coverEmoji: (data.coverEmoji ?? "📔") as string,
    draft: data.draft === true,
    content,
  });
}
