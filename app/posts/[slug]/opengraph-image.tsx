import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getPost, getAllPosts, formatDate } from "@/lib/diary";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

const thaiFont = fs.readFileSync(
  path.join(process.cwd(), "app/posts/[slug]/_assets/NotoSansThai-Regular.woff")
);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const title = post?.title ?? "My Diary";
  const meta = post ? `${formatDate(post.date)} · อ่าน ${post.readingTime} นาที` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#faf6f0",
          padding: "70px 80px",
          fontFamily: "NotoSansThai",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: "#b5835a", fontSize: 30, letterSpacing: 4 }}>
          — personal diary —
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 66, color: "#2c2416", lineHeight: 1.25, fontWeight: 600 }}>{title}</div>
          {meta && <div style={{ fontSize: 30, color: "#5a4e3c", marginTop: 24 }}>{meta}</div>}
        </div>
        <div style={{ display: "flex", color: "#b5835a", fontSize: 28 }}>My Diary · written with love</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "NotoSansThai", data: thaiFont, weight: 400, style: "normal" }],
    }
  );
}
