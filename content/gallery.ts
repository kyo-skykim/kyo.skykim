export type Photo = {
  src: string;       // path inside public/, e.g. "gallery/photo1.jpg"
  caption?: string;
  date?: string;     // e.g. "2026-05" or "2026-05-14"
  location?: string;
};

export const photos: Photo[] = [
  { src: "gallery/shabu_2_may_2026.jpg", caption: "I love shabuuuuu", date: "2026-05-02", location: "Park Chula" },
  { src: "gallery/giewnam_15_may_2026.jpg", caption: "เกี๊ยวน้ำอร่อยมาก ร้านประจำตั้งแต่เด็ก", date: "2026-05-15", location: "ซอยนารี" },
];
