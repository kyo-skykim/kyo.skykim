import Nav from "@/components/Nav";

const skills = [
  { category: "Data Engineering", items: ["Python", "Apache Spark", "Airflow", "dbt", "SQL"] },
  { category: "Cloud & Infra", items: ["AWS", "GCP", "Docker", "Kubernetes", "Terraform"] },
  { category: "Architecture", items: ["ETL/ELT Pipelines", "Data Warehouse", "Lakehouse", "Streaming"] },
];

const experience = [
  { year: "2024 – Present", role: "Data Engineer", company: "ETH Zürich", desc: "Designed and implemented data pipelines and architecture for research projects." },
  { year: "2022 – 2024", role: "Data Analyst", company: "Previous Company", desc: "Built dashboards and automated reporting workflows." },
];

const education = [
  { year: "2022 – 2024", degree: "M.Sc. Data Science", school: "ETH Zürich" },
  { year: "2018 – 2022", degree: "B.Eng. Computer Engineering", school: "Chulalongkorn University" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Profile */}
        <section className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: "var(--accent-light)", border: "2px solid var(--border)" }}
          >
            🧑‍💻
          </div>
          <div>
            <h1
              className="text-3xl mb-1"
              style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
            >
              Conlathit Phuncam
            </h1>
            <p style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)", fontSize: "0.9rem" }}>
              Data Engineer · ETH Zürich
            </p>
          </div>
        </section>

        {/* Download CV */}
        <section
          className="rounded-2xl p-6 flex items-center justify-between"
          style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
              Curriculum Vitae
            </p>
            <p className="text-sm" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
              CV_Conlathit_Phuncam.pdf
            </p>
          </div>
          <a
            href="/CV_Conlathit_Phuncam.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-5 py-2 rounded-full transition-opacity hover:opacity-70"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            Download
          </a>
        </section>

        {/* Experience */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
          >
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((e, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>{e.role}</p>
                    <p className="text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.company}</p>
                  </div>
                  <span className="text-xs shrink-0 mt-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.year}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-light)", fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic" }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
          >
            Education
          </h2>
          <div className="space-y-3">
            {education.map((e, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 flex items-start justify-between gap-4"
                style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>{e.degree}</p>
                  <p className="text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.school}</p>
                </div>
                <span className="text-xs shrink-0 mt-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.year}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
          >
            Skills
          </h2>
          <div className="space-y-3">
            {skills.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm mb-3" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)", fontWeight: 500 }}>{s.category}</p>
                <div className="flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
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
