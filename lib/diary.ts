import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content/diary");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  mood: string;
  tags: string[];
  coverEmoji: string;
  readingTime: number;
  draft?: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

function toTimestamp(dateStr: string): number {
  const ts = Date.parse(dateStr);
  return isNaN(ts) ? 0 : ts;
}

// นับเวลาอ่านโดยประมาณ — ภาษาไทยใช้จำนวนตัวอักษร (~350 ตัว/นาที)
function readingMinutes(text: string): number {
  const chars = text.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 350));
}

function parsePostMeta(filename: string, raw: string): PostMeta {
  const slug = filename.replace(/\.md$/, "");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    mood: data.mood ?? "😊",
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverEmoji: data.coverEmoji ?? "📔",
    readingTime: readingMinutes(content),
    ...(data.draft === true ? { draft: true } : {}),
  };
}

// สาธารณะ — กรองโพสต์ draft ออก
export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((f) => !f.startsWith("."));
  const posts = files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(postsDir, filename), "utf-8");
      return parsePostMeta(filename, raw);
    })
    .filter((p) => !p.draft);

  return posts.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

// Admin — รวมโพสต์ draft ด้วย
export function getAllPostsAdmin(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((f) => !f.startsWith("."));
  const posts = files.map((filename) => {
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf-8");
    return parsePostMeta(filename, raw);
  });

  return posts.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = fs.existsSync(path.join(postsDir, `${slug}.md`))
    ? path.join(postsDir, `${slug}.md`)
    : path.join(postsDir, slug);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content: mdContent } = matter(raw);
  const processed = await remark().use(html).process(mdContent);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    mood: data.mood ?? "😊",
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverEmoji: data.coverEmoji ?? "📔",
    readingTime: readingMinutes(mdContent),
    content: processed.toString(),
    ...(data.draft === true ? { draft: true } : {}),
  };
}

// โพสต์ที่เกี่ยวข้อง — เลือกจาก tag ที่ตรงกันมากสุด เติมด้วยโพสต์ล่าสุด
export function getRelatedPosts(slug: string, tags: string[], limit = 3): PostMeta[] {
  const others = getAllPosts().filter((p) => p.slug !== slug);
  const scored = others
    .map((p) => ({ post: p, score: p.tags.filter((t) => tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || toTimestamp(b.post.date) - toTimestamp(a.post.date));
  return scored.slice(0, limit).map((s) => s.post);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const hasTime = dateStr.includes("T") || dateStr.includes(" ");
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(hasTime && { hour: "2-digit", minute: "2-digit" }),
  });
}
