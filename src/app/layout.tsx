import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Snowfall from "@/components/Snowfall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peppermint Tracker | The Great Penguin Heist",
  description: "Track the adventures of Peppermint the inflatable penguin as neighbors steal and display this festive friend!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Snowfall />
        <main className="relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-8 text-white/30 text-xs">
          <p>Peppermint Tracker</p>
        </footer>
      </body>
    </html>
  );
}
