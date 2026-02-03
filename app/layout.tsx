import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QEP AISolve - Move fast without getting exposed",
  description: "From messy business question to board-ready strategic plan — with the rationale, risks, and unconventional options already mapped out. In 20 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
