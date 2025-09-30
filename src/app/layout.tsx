import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
// 用 CSS 变量承载字体，方便在 Tailwind 里引用
const inter = Inter({
  subsets: ["latin"],               // Inter 仅含西文；中文走后备字体
  display: "swap",                  // 防止首屏闪烁
  variable: "--font-sans",          // 暴露成 CSS 变量
});
export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Toaster  />
      </body>
    </html>
  );
}
