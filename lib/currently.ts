import fs from "fs";
import path from "path";

export interface CurrentlyItem {
  id: string;
  label: string;
  emoji: string;
  title: string;
  detail: string;
  href?: string;
}

export interface CurrentlyData {
  updatedAt: string;
  items: CurrentlyItem[];
}

const currentlyPath = path.join(process.cwd(), "content/currently.json");

export function getCurrently(): CurrentlyData {
  try {
    const data = JSON.parse(fs.readFileSync(currentlyPath, "utf-8")) as Partial<CurrentlyData>;
    return {
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
      items: Array.isArray(data.items) ? data.items.filter(isCurrentlyItem) : [],
    };
  } catch {
    return { updatedAt: "", items: [] };
  }
}

function isCurrentlyItem(item: unknown): item is CurrentlyItem {
  if (!item || typeof item !== "object") return false;
  const value = item as Partial<CurrentlyItem>;
  return [value.id, value.label, value.emoji, value.title, value.detail]
    .every((field) => typeof field === "string");
}

export function formatCurrentlyDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}
