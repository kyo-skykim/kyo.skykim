import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, deleteFile, listFiles, readFile } from "@/lib/admin/github";
import { rejectCrossOrigin } from "@/lib/admin/security";
import matter from "gray-matter";

function bangkokNow(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
}

function readingMinutes(text: string): number {
  const chars = text.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 350));
}

function buildMarkdown(fields: {
  title: string;
  date: string;
  excerpt: string;
  mood: string;
  tags: string[];
  coverEmoji: string;
  draft?: boolean;
  content: string;
}): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(fields.title)}`,
    `date: "${fields.date}"`,
    `excerpt: ${JSON.stringify(fields.excerpt)}`,
    `mood: ${JSON.stringify(fields.mood)}`,
    `tags: ${JSON.stringify(fields.tags)}`,
    `coverEmoji: ${JSON.stringify(fields.coverEmoji)}`,
  ];
  if (fields.draft) lines.push(`draft: true`);
  lines.push("---", "", fields.content, "");
  return lines.join("\n");
}

// GET — list all posts including drafts
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
    const files = await listFiles("content/diary");
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const posts = await Promise.all(
      mdFiles.map(async (filename) => {
        const slug = filename.replace(/\.md$/, "");
        const raw = await readFile(`content/diary/${filename}`);
        if (!raw) return null;
        const { data, content } = matter(raw);
        return {
          slug,
          title: (data.title ?? slug) as string,
          date: (data.date ?? "") as string,
          excerpt: (data.excerpt ?? "") as string,
          mood: (data.mood ?? "😊") as string,
          tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
          coverEmoji: (data.coverEmoji ?? "📔") as string,
          readingTime: readingMinutes(content),
          draft: data.draft === true,
        };
      })
    );

    const sorted = posts
      .filter(Boolean)
      .sort((a, b) => {
        const ta = Date.parse((a!.date) || "") || 0;
        const tb = Date.parse((b!.date) || "") || 0;
        return tb - ta;
      });

    return Response.json({ posts: sorted });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 502 });
  }
}

// PUT — update existing post
export async function PUT(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
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
  const slug = (body?.slug ?? "").trim();
  const title = (body?.title ?? "").trim();
  const content = (body?.content ?? "").trim();
  if (!slug || !title || !content) {
    return Response.json({ error: "ต้องระบุ slug, title และ content" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(slug)) {
    return Response.json({ error: "slug ไม่ถูกต้อง" }, { status: 400 });
  }

  const mood = (body?.mood ?? "😊").trim() || "😊";
  const coverEmoji = (body?.coverEmoji ?? "📔").trim() || "📔";
  const excerpt = (body?.excerpt ?? "").trim() || content.replace(/\s+/g, " ").slice(0, 90);
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((t: string) => String(t).trim()).filter(Boolean)
    : String(body?.tags ?? "").split(",").map((t: string) => t.trim()).filter(Boolean);
  const date = (body?.date ?? "").trim() || bangkokNow();
  const draft = body?.draft === true;

  const md = buildMarkdown({ title, date, excerpt, mood, tags, coverEmoji, draft, content });

  try {
    await commitFiles(
      [{ path: `content/diary/${slug}.md`, content: md, encoding: "utf-8" }],
      `Update diary post: ${title}`
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "commit ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true, slug });
}

// DELETE — delete post
export async function DELETE(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
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
  const slug = (body?.slug ?? "").trim();
  if (!slug) {
    return Response.json({ error: "ต้องระบุ slug" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(slug)) {
    return Response.json({ error: "slug ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await deleteFile(`content/diary/${slug}.md`, `Delete diary post: ${slug}`);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "ลบโพสต์ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
