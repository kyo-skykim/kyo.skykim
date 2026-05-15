import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import MusicPlayer from "@/components/ui/MusicPlayer";
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
  title: "My Diary",
  description: "A personal diary and lifestyle blog",
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
        <MusicPlayer />
      </body>
    </html>
  );
}
