import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AppProviders } from "./providers";

const inter = Inter({
  subsets: ["latin"],       // Western fonts only
  display: "swap",          // Avoid flash of invisible text
  variable: "--font-sans",  // Expose as CSS variable for Tailwind
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
    <html lang="en" className={inter.variable}>
      <head>
        {/* Optional: can remove if using next/font only */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
