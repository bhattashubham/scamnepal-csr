import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Community Scam Registry",
  description: "A comprehensive platform for tracking and reporting scams with community-driven verification",
  keywords: ["scam", "registry", "community", "security", "fraud", "protection"],
  authors: [{ name: "CSR Team" }],
  openGraph: {
    title: "Community Scam Registry",
    description: "Protect yourself and others from scams with our community-driven platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
