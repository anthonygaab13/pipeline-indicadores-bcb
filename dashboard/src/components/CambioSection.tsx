"use client";

// Seção do câmbio: título + toggle de período (1A/5A/Tudo) + o LineChart.
// O toggle é client-side puro (recorta o array já carregado, sem novo fetch) —
// o histórico completo é pequeno o bastante (poucas centenas de KB) pra já vir
// todo no primeiro load em vez de valer a pena buscar por partes.

import { useMemo, useState } from "react";
import type { CambioPoint } from "@/lib/data";
import { LineChart } from "./charts/LineChart";

const RANGES = [
  { key: "1a", label: "1 ano", days: 252 },
  { key: "5a", label: "5 anos", days: 252 * 5 },
  { key: "tudo", label: "Tudo (10 anos)", days: Infinity },
] as const;

export function CambioSection({ data }: { data: CambioPoint[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("5a");

  const sliced = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days;
    return Number.isFinite(days) ? data.slice(-days) : data;
  }, [data, range]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Câmbio (USD/BRL) e médias móveis</h3>
        <div className="flex gap-1 rounded-full border border-border bg-background p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <LineChart
        xLabels={sliced.map((d) => d.data)}
        yFormat="decimal2"
        series={[
          { key: "cambio", label: "Câmbio", color: "var(--series-cambio)", areaFill: true, data: sliced.map((d) => d.cambio) },
          {
            key: "mm7",
            label: "Média móvel 7d",
            color: "var(--series-cambio)",
            opacity: 0.55,
            data: sliced.map((d) => d.media_movel_7d),
          },
          {
            key: "mm30",
            label: "Média móvel 30d",
            color: "var(--series-cambio)",
            opacity: 0.3,
            data: sliced.map((d) => d.media_movel_30d),
          },
        ]}
      />
    </div>
  );
}
