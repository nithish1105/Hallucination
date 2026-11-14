import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAYA AI — Don't just trust AI. Verify it.",
  description:
    "Ask MAYA AI a question, then review the evidence behind each factual claim.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
