import Nav from "@/components/layout/Nav";
import GalleryGrid from "@/components/ui/GalleryGrid";
import { getAllPhotos } from "@/lib/gallery";

export default function GalleryPage() {
  const photos = getAllPhotos();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
          >
            Gallery
          </h1>
          <p
            className="text-base"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}
          >
            ภาพเล็กๆ จากชีวิตประจำวัน
          </p>
        </header>

        {photos.length === 0 ? (
          <div
            className="rounded-2xl py-20 text-center"
            style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
          >
            <p className="text-4xl mb-4">🌸</p>
            <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
              ยังไม่มีรูปภาพ...
            </p>
            <p className="text-xs mt-2" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
              เพิ่มรูปได้ที่ content/gallery.ts
            </p>
          </div>
        ) : (
          <GalleryGrid photos={photos} />
        )}
      </main>

      <footer
        className="text-center py-8 text-xs mt-4"
        style={{ borderTop: "1px solid var(--border)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)", letterSpacing: "0.05em" }}
      >
        written with love ✦
      </footer>
    </div>
  );
}
