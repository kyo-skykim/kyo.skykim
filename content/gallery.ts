export type Photo = {
  src: string;       // path inside public/, e.g. "gallery/photo1.jpg"
  caption?: string;
  date?: string;     // e.g. "2026-05" or "2026-05-14"
  location?: string;
};

export const photos: Photo[] = [
  // เพิ่มรูปได้ที่นี่ เช่น:
  // { src: "gallery/cafe.jpg", caption: "morning coffee", date: "2026-05", location: "Bangkok" },
];
