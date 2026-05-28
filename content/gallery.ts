// ============================================================
//  Gallery — แค่ upload รูปเข้า public/gallery/ รูปก็ขึ้นเว็บเอง
//  ถ้าอยากใส่ caption / location ให้รูปไหน เพิ่มที่นี่ (ไม่บังคับ)
//  key = ชื่อไฟล์ใน public/gallery/
// ============================================================

export type PhotoMeta = {
  caption?: string;
  date?: string;     // e.g. "2026-05-14" — ถ้าไม่ใส่จะเรียงตามเวลาที่ upload
  location?: string;
};

export const captions: Record<string, PhotoMeta> = {
  "shabu_2_may_2026.jpg": { caption: "I love shabuuuuu", date: "2026-05-02", location: "Park Chula" },
  "giewnam_15_may_2026.jpg": { caption: "เกี๊ยวน้ำอร่อยมาก ร้านประจำตั้งแต่เด็ก", date: "2026-05-15", location: "ซอยนารี" },
  "ori_22-05-2026.jpg": { caption: "สาวสัตวแพทย์มขมาเจอที่ mrt ได้ำงงงง", date: "2026-05-22", location: "MRT บางหว้า" },
  "boon-22-05-2026.jpg": { caption: "ละหมอวชิระเขามาคนเดียวไม่ได้ ชั้นเข้าเมืองก็เอาไปทรมานขาเล่น", date: "2026-05-22", location: "วชิรพยาบาล" },
};
