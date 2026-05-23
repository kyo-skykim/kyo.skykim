export type Photo = {
  src: string;       // path inside public/, e.g. "gallery/photo1.jpg"
  caption?: string;
  date?: string;     // e.g. "2026-05" or "2026-05-14"
  location?: string;
};

export const photos: Photo[] = [
  { src: "gallery/shabu_2_may_2026.jpg", caption: "I love shabuuuuu", date: "2026-05-02", location: "Park Chula" },
  { src: "gallery/giewnam_15_may_2026.jpg", caption: "เกี๊ยวน้ำอร่อยมาก ร้านประจำตั้งแต่เด็ก", date: "2026-05-15", location: "ซอยนารี" },
  { src: "gallery/ori_22-05-2026.jpg", caption: "สาวสัตวแพทย์มขมาเจอที่ mrt ได้ำงงงง", date: "2026-05-22", location: "MRT บางหว้า" },
  { src: "gallery/boon-22-05-2026.jpg", caption: "ละหมอวชิระเขามาคนเดียวไม่ได้ ชั้นเข้าเมืองก็เอาไปทรมานขาเล่น", date: "2026-05-22", location: "วชิรพยาบาล" },
];
