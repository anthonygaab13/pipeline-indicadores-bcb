import { loadCambio, loadMensal, loadSelic, loadStats } from "@/lib/data";
import { computeInsights } from "@/lib/insights";
import { StatTile } from "@/components/StatTile";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Calculator } from "@/components/Calculator";
import { CambioSection } from "@/components/CambioSection";
import { LineChart } from "@/components/charts/LineChart";
import { ComboChart } from "@/components/charts/ComboChart";
import { DataTable } from "@/components/DataTable";
import { ArchitectureSection } from "@/components/ArchitectureSection";
import { ArrowLeftIcon, ArrowUpRightIcon, BookOpenIcon, GithubIcon } from "@/components/icons";
import { formatDateFull } from "@/components/charts/chart-utils";

const REPO_URL = "https://github.com/anthonygaab13/pipeline-indicadores-bcb";
const PORTFOLIO_URL = "https://anthonygabriel.vercel.app";

function signed(value: number, digits = 2, suffix = "") {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}${suffix}`;
}

export default function Home() {
  const cambio = loadCambio();
  const selic = loadSelic();
  const mensal = loadMensal();
  const stats = loadStats();
  const insights = computeInsights(stats, cambio, mensal);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <a href={PORTFOLIO_URL} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" />
          Portfólio
        </a>
        <div className="flex items-center gap-3">
          <a href="/metodologia" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <BookOpenIcon className="size-3.5" />
            Metodologia
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/30"
          >
            <GithubIcon className="size-4" />
            Repositório
            <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      <header className="mb-10">
        <p className="font-mono text-xs tracking-wider text-primary uppercase">Pipeline de Dados · BCB</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Indicadores <span className="text-gradient-accent">Financeiros</span> do Banco Central
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Câmbio (USD/BRL), Selic e IPCA extraídos da API pública do Banco Central, tratados numa
          pipeline em arquitetura medallion e atualizados automaticamente toda semana.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Período: {formatDateFull(stats.periodo_inicio)} — {formatDateFull(stats.periodo_fim)} · Fonte: Banco
          Central do Brasil (SGS) ·{" "}
          <a href="/metodologia" className="underline-offset-4 hover:text-foreground hover:underline">
            ver metodologia
          </a>
        </p>
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Câmbio (USD/BRL)"
          value={`R$ ${stats.cambio.toFixed(4)}`}
          deltaLabel={`${signed(stats.cambio_variacao_pct_dia, 2, "%")} no dia`}
          deltaDirection="neutral"
          sparkline={cambio.slice(-30).map((d) => d.cambio)}
          accentColor="var(--series-cambio)"
        />
        <StatTile
          label="Selic"
          value={`${stats.selic_anualizada.toFixed(2)}% a.a.`}
          deltaLabel={`${stats.selic.toFixed(4)}% ao dia`}
          deltaDirection="neutral"
          sparkline={selic.slice(-90).map((d) => d.selic)}
          accentColor="var(--series-selic)"
        />
        <StatTile
          label="IPCA acumulado (12 meses)"
          value={`${stats.ipca_acumulado_12m.toFixed(2)}%`}
          deltaLabel={`${signed(stats.ipca_acumulado_12m_delta, 2, "pp")} vs mês anterior`}
          deltaDirection="down-good"
          sparkline={mensal.slice(-12).map((d) => d.ipca_acumulado_12m)}
          accentColor="var(--series-ipca)"
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-foreground">Leituras automáticas</h2>
        <InsightsPanel insights={insights} />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium text-foreground">Calculadora</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Ferramentas rápidas de campo — câmbio e Selic direto da fonte oficial, sem precisar abrir planilha.
        </p>
        <Calculator
          fallback={{
            cambio: stats.cambio,
            cambioData: stats.cambio_data,
            selicDiaria: stats.selic,
            selicData: stats.selic_data,
          }}
        />
      </section>

      <section className="mb-10 rounded-lg border border-border bg-card p-5">
        <CambioSection data={cambio} />
      </section>

      <section className="mb-10 rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">Selic (% ao dia)</h3>
        <LineChart
          xLabels={selic.map((d) => d.data)}
          yFormat="percent3"
          series={[{ key: "selic", label: "Selic", color: "var(--series-selic)", data: selic.map((d) => d.selic) }]}
        />
      </section>

      <section className="mb-10 rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">IPCA — variação mensal e acumulado em 12 meses</h3>
        <ComboChart
          xLabels={mensal.map((d) => d.mes.slice(0, 7))}
          bars={mensal.map((d) => d.ipca_mensal)}
          line={mensal.map((d) => d.ipca_acumulado_12m)}
          barColor="var(--series-ipca)"
          lineColor="var(--foreground)"
          barLabel="Variação mensal"
          lineLabel="Acumulado 12 meses"
        />
      </section>

      <section className="mb-10">
        <DataTable rows={mensal} />
      </section>

      <section className="mb-10">
        <ArchitectureSection />
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Construído por{" "}
        <a href={PORTFOLIO_URL} className="text-foreground underline-offset-4 hover:underline">
          Anthony Gabriel
        </a>{" "}
        · dados públicos do{" "}
        <a href="https://www3.bcb.gov.br/sgspub" target="_blank" rel="noopener noreferrer" className="text-foreground underline-offset-4 hover:underline">
          Banco Central (SGS)
        </a>
      </footer>
    </main>
  );
}
