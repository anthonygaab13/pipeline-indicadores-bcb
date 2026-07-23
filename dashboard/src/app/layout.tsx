import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Identidade "Terminal", versão enxuta: mono só onde é dado ou rótulo (título, valor de
// stat tile, badge de stack, eyebrow) — não a fonte do site inteiro. Parágrafo longo em
// mono lê como "poluído"; a leitura do produto tem que continuar rápida.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indicadores BCB · Câmbio, Selic e IPCA",
  description:
    "Dashboard com câmbio (USD/BRL), Selic e IPCA a partir de um pipeline de dados em arquitetura medallion (bronze/silver/gold), por Anthony Gabriel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${jetbrainsMono.variable} ${plexSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
