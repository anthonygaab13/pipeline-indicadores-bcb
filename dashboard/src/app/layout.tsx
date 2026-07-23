import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Identidade "Boletim": três papéis, três fontes. Fraunces (serifada) só em título e nos
// números grandes dos StatTiles — dá o ar "relatório oficial". IBM Plex Sans é o corpo do
// texto (legibilidade, não decoração). IBM Plex Mono fica reservado pra eyebrow, rótulo e
// dado tabular (data table, eixo de gráfico) — nunca a fonte do site inteiro.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  weight: ["500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
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
    <html lang="pt-BR" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
