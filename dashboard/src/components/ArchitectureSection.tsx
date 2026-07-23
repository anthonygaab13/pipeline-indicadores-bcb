// Seção "Como funciona": explica a arquitetura medallion em 3 passos + stack técnica +
// links pro repositório e pro portfólio. Puramente estático (Server Component).

const STEPS = [
  {
    step: "§ 01",
    title: "Bronze",
    description: "Dado bruto direto da API do Banco Central (SGS), sem tratamento: o registro fiel do que a fonte devolveu.",
  },
  {
    step: "§ 02",
    title: "Silver",
    description: "Datas e valores tipados, deduplicados e validados: nenhuma linha inválida passa pra frente.",
  },
  {
    step: "§ 03",
    title: "Gold",
    description: "Agregações de negócio via SQL (DuckDB): médias móveis, variação diária, IPCA acumulado em 12 meses.",
  },
];

const STACK = ["Python", "Polars", "DuckDB", "Delta Lake", "GitHub Actions", "Next.js"];

export function ArchitectureSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-foreground">Como funciona</h2>
      <p className="mt-1 max-w-2xl text-base leading-relaxed text-body">
        Pipeline de dados em arquitetura medallion, atualizado automaticamente toda semana via GitHub
        Actions. Este dashboard lê os dados diretamente das tabelas gold geradas pela pipeline.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.step}>
            <p className="font-mono text-xs text-primary">{s.step}</p>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-4">
        {STACK.map((tech) => (
          <span key={tech} className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
