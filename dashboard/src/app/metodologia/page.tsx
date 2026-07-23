// Página de transparência: lista toda fonte de dado e toda fórmula usada no dashboard, uma
// por seção com âncora própria (#id) — os links "Fonte e metodologia" espalhados pelo site
// (InsightsPanel, Calculator) apontam pra cá. Server Component estático, sem dado dinâmico:
// o conteúdo vem inteiro de lib/methodology.ts.

import Link from "next/link";
import { methodology } from "@/lib/methodology";
import { ArrowLeftIcon, ArrowUpRightIcon } from "@/components/icons";

export const metadata = {
  title: "Metodologia · Indicadores BCB",
  description: "De onde vêm os dados e como cada número deste dashboard é calculado.",
};

export default function MetodologiaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" />
        Voltar ao dashboard
      </Link>

      <header className="mb-10">
        <p className="font-mono text-xs tracking-wider text-primary uppercase">Transparência</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Fontes e metodologia</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-body">
          Todo número mostrado neste dashboard é rastreável até aqui: qual série oficial ele usa e qual conta foi
          feita em cima dela. Nada é estimado por IA/modelo: são fórmulas fixas e auditáveis, documentadas abaixo.
        </p>
        <div className="rule-fade mt-6" />
      </header>

      <div className="space-y-6">
        {methodology.map((entry) => (
          <section key={entry.id} id={entry.id} className="scroll-mt-6 rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">{entry.title}</h2>
            <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-body">{entry.summary}</p>

            {entry.formula && (
              <p className="mt-3 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground">
                {entry.formula}
              </p>
            )}

            <ul className="mt-3 space-y-1">
              {entry.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {source.label}
                    <ArrowUpRightIcon className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-border py-6 text-center text-xs text-muted-foreground">
        Dúvidas sobre algum cálculo?{" "}
        <a
          href="https://github.com/anthonygaab13/pipeline-indicadores-bcb"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          O código-fonte é público
        </a>
        .
      </footer>
    </main>
  );
}
