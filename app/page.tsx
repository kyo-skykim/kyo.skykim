import Nav from "@/components/layout/Nav";
import DiaryBrowser from "@/components/diary/DiaryBrowser";
import { formatDate, getAllPosts } from "@/lib/diary";

export const dynamic = "force-dynamic";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />
      {/* Header */}
      <header
        className="border-b py-12 text-center"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}
      >
        <p
          className="text-sm uppercase tracking-widest mb-3"
          style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)", letterSpacing: "0.15em" }}
        >
          — personal diary —
        </p>
        <h1
          className="text-5xl mb-3"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
        >
          My Diary
        </h1>
        <p
          className="text-base"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}
        >
          บันทึกเล็กๆ ของชีวิตประจำวัน
        </p>
      </header>

      {/* Posts */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <DiaryBrowser posts={posts.map((post) => ({ ...post, dateLabel: formatDate(post.date) }))} />
      </main>

      <footer
        className="text-center py-8 text-xs"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--accent)",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          letterSpacing: "0.05em",
        }}
      >
        written with love ✦
      </footer>
    </div>
  );
}
