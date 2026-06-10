import fs from "fs";
import path from "path";

export interface Track {
  type: "youtube" | "file";
  title: string;
  artist?: string;
  src: string; // youtube video ID หรือ path ใน public/ เช่น "music/song.mp3"
}

const musicFile = path.join(process.cwd(), "content/music.json");

export function getTracks(): Track[] {
  try {
    const data = JSON.parse(fs.readFileSync(musicFile, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
