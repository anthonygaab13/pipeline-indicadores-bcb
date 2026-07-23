import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Identidade "Terminal": uma única família monoespaçada pro site inteiro (título, corpo,
// número, label) — não é font-mono só nos rótulos como antes, é a fonte de tudo.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
    <html lang="pt-BR" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
