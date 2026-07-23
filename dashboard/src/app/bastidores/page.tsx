// "Bastidores" — o diário de bordo do projeto (ver lib/devlog.ts pra adicionar entradas).
// Server Component estático: uma timeline vertical com ponto luminoso por entrada, no mesmo
// idioma visual "Aurora" do resto do site (glow no acento, cards em vidro).

import Link from "next/link";
import { devlog } from "@/lib/devlog";
import { ArrowLeftIcon } from "@/components/icons";
import { formatDateFull } from "@/components/charts/chart-utils";

export const metadata = {
  title: "Bastidores · Indicadores BCB",
  description: "Diário de bordo do projeto: decisões, erros e aprendizados reais, na ordem em que aconteceram.",
};

export default function BastidoresPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" />
        Voltar ao dashboard
      </Link>

      <header className="mb-12">
        <p className="font-mono text-xs tracking-wider text-primary uppercase">Bastidores</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Diário de <span className="text-gradient-accent">bordo</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Não é changelog técnico: é o porquê por trás de cada decisão, contado do jeito que aconteceu de verdade,
          erros incluídos. Atualizo conforme o projeto (e os próximos) avançam.
        </p>
      </header>

      <ol className="relative space-y-10 border-l border-border pl-7">
        {devlog.map((entry) => (
          <li key={entry.title} className="relative">
            <span
              className="absolute top-1.5 -left-[31px] size-2.5 rounded-full bg-primary"
              style={{ boxShadow: "0 0 12px var(--primary)" }}
              aria-hidden
            />
            <p className="font-mono text-xs text-muted-foreground">
              {formatDateFull(entry.date)} <span className="text-primary">· {entry.tag}</span>
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">{entry.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
          </li>
        ))}
      </ol>

      <footer className="mt-12 border-t border-border py-6 text-center text-xs text-muted-foreground">
        Quer trocar ideia sobre alguma dessas decisões?{" "}
        <a
          href="https://www.linkedin.com/in/anthony-gabriel-3858631b9"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Me chama no LinkedIn
        </a>
        .
      </footer>
    </main>
  );
}
