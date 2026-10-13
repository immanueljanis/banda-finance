import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header, Footer } from "@/components/shell";
import "./globals.css";
const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const metadata: Metadata = {
  title: "Banda | Composable ETFs onchain",
  description: "Onchain portfolio baskets on Arc: each deposit is an NFT with its own vault.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable}`}>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
