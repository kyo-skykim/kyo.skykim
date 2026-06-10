import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, fileExists } from "@/lib/admin/github";

// เวลาปัจจุบันแบบ "2026-06-10T14:30:00" (โซนเวลาไทย)
function bangkokNow(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
}

function makeSlug(title: string, now: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length >= 3) return base.slice(0, 60);
  return `diary-${now.slice(0, 16).replace(/[T:]/g, "-")}`;
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

  const body = await request.json().catch(() => null);
  const title = (body?.title ?? "").trim();
  const content = (body?.content ?? "").trim();
  if (!title || !content) {
    return Response.json({ error: "ต้องใส่หัวข้อและเนื้อหา" }, { status: 400 });
  }

  const mood = (body?.mood ?? "😊").trim() || "😊";
  const coverEmoji = (body?.coverEmoji ?? "📔").trim() || "📔";
  const excerpt = (body?.excerpt ?? "").trim() || content.replace(/\s+/g, " ").slice(0, 90);
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((t: string) => String(t).trim()).filter(Boolean)
    : String(body?.tags ?? "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
  const draft = body?.draft === true;

  const now = bangkokNow();
  const date = (body?.date ?? "").trim() || now;
  let slug = makeSlug(title, now);
  if (await fileExists(`content/diary/${slug}.md`)) {
    slug = `${slug}-${now.slice(11, 16).replace(":", "")}`;
  }

  const mdLines = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: "${date}"`,
    `excerpt: ${JSON.stringify(excerpt)}`,
    `mood: ${JSON.stringify(mood)}`,
    `tags: ${JSON.stringify(tags)}`,
    `coverEmoji: ${JSON.stringify(coverEmoji)}`,
  ];
  if (draft) mdLines.push("draft: true");
  mdLines.push("---", "", content, "");
  const md = mdLines.join("\n");

  try {
    await commitFiles(
      [{ path: `content/diary/${slug}.md`, content: md, encoding: "utf-8" }],
      `New diary post: ${title}`
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "commit ไม่สำเร็จ" }, { status: 502 });
  }

  return Response.json({ ok: true, slug });
}
