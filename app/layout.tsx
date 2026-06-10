import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import MusicPlayer from "@/components/ui/MusicPlayer";
import { getTracks } from "@/lib/music";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kyo-skykim.vercel.app"),
  title: {
    default: "My Diary",
    template: "%s",
  },
  description: "A personal diary and lifestyle blog",
  openGraph: {
    title: "My Diary",
    description: "บันทึกเล็กๆ ของชีวิตประจำวัน",
    type: "website",
    siteName: "My Diary",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Diary",
    description: "บันทึกเล็กๆ ของชีวิตประจำวัน",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${lora.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}` }} />
      </head>
      <body
        className="min-h-screen"
        style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
      >
        {children}
        <MusicPlayer tracks={getTracks()} />
      </body>
    </html>
  );
}
