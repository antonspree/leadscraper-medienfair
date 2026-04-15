import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteNav } from "@/components/site-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SHK Lead Scraper",
  description: "Automatisches Lead-Scraping für SHK-Betriebe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body
        className={cn(
          "min-h-screen bg-[#0a0a0f] font-sans text-foreground antialiased",
          inter.variable,
          dmMono.variable
        )}
      >
        <SiteNav />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
