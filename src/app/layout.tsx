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
  manifest: "/manifest.json",
  themeColor: "#c41e3a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Peppermint",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/icon-384.png", sizes: "384x384", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icon-192.png" }],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Snowfall />
        <main className="relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-8 text-white/50 text-xs">
          <p className="mb-3">Peppermint Tracker</p>
          <img
            src="https://hitwebcounter.com/counter/counter.php?page=17058392&style=0007&nbdigits=6&type=page&initCount=0"
            alt="Visitor Counter"
            className="inline-block scale-[2]"
          />
        </footer>
      </body>
    </html>
  );
}
