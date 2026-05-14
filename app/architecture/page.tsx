import Nav from "@/components/Nav";

const docs = [
  {
    title: "ETH Architecture",
    filename: "eth_architecture_Aomsin.pdf.pdf",
    desc: "System architecture design for ETH project",
    emoji: "🏗️",
  },
  {
    title: "Data Pipeline for ETH",
    filename: "kyo_miniproject_datapipeline for ETH.pdf",
    desc: "Mini project: data pipeline design and implementation",
    emoji: "🔄",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
          >
            Architecture
          </h1>
          <p
            className="text-base"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}
          >
            System design and data pipeline documents
          </p>
        </header>

        {/* Document cards */}
        <div className="space-y-4 mb-10">
          {docs.map((doc) => (
            <a
              key={doc.filename}
              href={`/${doc.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--warm-white)",
                border: "1px solid var(--border)",
                boxShadow: "0 1px 4px rgba(44,36,22,0.05)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: "var(--accent-light)" }}
                >
                  {doc.emoji}
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500, fontSize: "1.05rem" }}>
                    {doc.title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}>
                    {doc.desc}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                  Open PDF →
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* PDF Preview — first doc */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(44,36,22,0.05)" }}
        >
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ backgroundColor: "var(--warm-white)", borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
              Preview — ETH Architecture
            </p>
          </div>
          <iframe
            src="/eth_architecture_Aomsin.pdf.pdf"
            className="w-full"
            style={{ height: "70vh", border: "none" }}
            title="ETH Architecture PDF"
          />
        </div>
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
