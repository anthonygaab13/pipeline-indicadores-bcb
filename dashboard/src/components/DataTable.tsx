"use client";

// Vista em tabela dos dados mensais — a alternativa acessível aos gráficos (todo valor
// que aparece num gráfico também precisa estar alcançável sem depender de hover/mouse).
// Fica escondida atrás de um toggle pra não competir com os gráficos por atenção.

import { useState } from "react";
import type { MensalPoint } from "@/lib/data";
import { formatDateShort } from "./charts/chart-utils";

function fmt(v: number | null, digits = 2, suffix = "") {
  return v === null || v === undefined ? "—" : `${v.toFixed(digits)}${suffix}`;
}

export function DataTable({ rows }: { rows: MensalPoint[] }) {
  const [open, setOpen] = useState(false);
  const ordered = [...rows].reverse();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        aria-expanded={open}
      >
        {open ? "Ocultar tabela de dados" : "Ver dados em tabela"}
      </button>

      {open && (
        <div className="mt-3 max-h-96 overflow-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Mês</th>
                <th className="px-3 py-2 font-medium">Câmbio médio</th>
                <th className="px-3 py-2 font-medium">Câmbio fechamento</th>
                <th className="px-3 py-2 font-medium">Selic (% a.d.)</th>
                <th className="px-3 py-2 font-medium">IPCA mensal</th>
                <th className="px-3 py-2 font-medium">IPCA acum. 12m</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((r) => (
                <tr key={r.mes} className="border-t border-border tabular-nums">
                  <td className="px-3 py-1.5 text-foreground">{formatDateShort(r.mes.slice(0, 7))}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{fmt(r.cambio_medio)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{fmt(r.cambio_fechamento)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{fmt(r.selic_media, 4)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{fmt(r.ipca_mensal, 2, "%")}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{fmt(r.ipca_acumulado_12m, 2, "%")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
