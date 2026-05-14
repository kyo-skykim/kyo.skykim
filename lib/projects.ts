import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDir = path.join(process.cwd(), "content/projects");

export interface Project {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  pdf: string;
  date: string;
  tags: string[];
}

export function getAllProjects(): Project[] {
  if (!fs.existsSync(projectsDir)) return [];
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".md"));

  const projects = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(projectsDir, filename), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      emoji: data.emoji ?? "📄",
      pdf: data.pdf ?? "",
      date: data.date ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
    } as Project;
  });

  return projects.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
