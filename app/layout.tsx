import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QEP AISolve - Move fast without getting exposed",
  description: "From messy business question to board-ready strategic plan — with the rationale, risks, and unconventional options already mapped out. In 20 minutes.",
  keywords: ["business strategy", "AI consulting", "strategic planning", "SCQA", "business analysis", "solopreneur tools"],
  authors: [{ name: "QEP AI Labs" }],
  openGraph: {
    title: "QEP AISolve - Move fast without getting exposed",
    description: "Like having a top business consultant on speed dial — without the invoice. AI-powered strategic consulting for solopreneurs and mid-market companies.",
    url: "https://qep-aisolve.vercel.app",
    siteName: "QEP AISolve",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QEP AISolve - Move fast without getting exposed",
    description: "From messy business question to board-ready strategic plan — with the rationale, risks, and unconventional options already mapped out.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
