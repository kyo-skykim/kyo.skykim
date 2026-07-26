import Nav from "@/components/layout/Nav";
import { formatCurrentlyDate, getCurrently } from "@/lib/currently";

export const dynamic = "force-dynamic";

export default function CurrentlyPage() {
  const currently = getCurrently();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--accent)", letterSpacing: "0.15em" }}>— right now —</p>
          <h1 className="text-4xl" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>Currently</h1>
          <p className="mt-3 leading-relaxed" style={{ color: "var(--ink-light)", fontFamily: "var(--font-lora, Georgia, serif)" }}>
            สิ่งที่กำลังทำ เรียน ฟัง และสนใจอยู่ในช่วงนี้
          </p>
          {currently.updatedAt && <p className="text-xs mt-3" style={{ color: "var(--accent)" }}>อัปเดตล่าสุด {formatCurrentlyDate(currently.updatedAt)}</p>}
        </header>
        <div className="space-y-4">
          {currently.items.map((item) => {
            const content = (
              <article className="rounded-2xl p-6 flex items-start gap-4 transition-all hover:-translate-y-0.5" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(44,36,22,0.05)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "var(--accent-light)" }}>{item.emoji}</div>
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)", letterSpacing: "0.1em" }}>{item.label}</p>
                  <h2 className="text-xl mt-1" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>{item.title}</h2>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-light)" }}>{item.detail}</p>
                </div>
              </article>
            );
            return item.href ? <a key={item.id} href={item.href}>{content}</a> : <div key={item.id}>{content}</div>;
          })}
        </div>
        {currently.items.length === 0 && <p style={{ color: "var(--ink-light)" }}>ยังไม่มีข้อมูล Currently</p>}
      </main>
    </div>
  );
}
