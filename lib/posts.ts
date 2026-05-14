import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content/posts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  mood: string;
  tags: string[];
  coverEmoji: string;
}

export interface Post extends PostMeta {
  content: string;
}

function toTimestamp(dateStr: string): number {
  const ts = Date.parse(dateStr);
  return isNaN(ts) ? 0 : ts;
}

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? "",
      excerpt: data.excerpt ?? "",
      mood: data.mood ?? "😊",
      tags: Array.isArray(data.tags) ? data.tags : [],
      coverEmoji: data.coverEmoji ?? "📔",
    } as PostMeta;
  });

  return posts.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDir, `${slug}.md`);
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
    content: processed.toString(),
  };
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
