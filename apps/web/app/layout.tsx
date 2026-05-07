import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Looper — record, layer, loop",
  description: "A browser-first music looping studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
