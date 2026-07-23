// Grade de cards com as leituras automáticas calculadas em lib/insights.ts. Componente de
// servidor puro (sem "use client") — só renderiza texto, não precisa de interatividade.
//
// Cores de status seguem a paleta fixa "good/warning/serious/critical" da skill de dataviz
// (nunca reaproveitada pra série de gráfico) e vêm sempre acompanhadas de ícone + rótulo em
// texto — nunca só a cor — pra quem não distingue bem cor também identificar o status. A
// barra à esquerda do card repete a mesma cor do ícone/rótulo (reforço, não decoração nova).

import type { ComponentType, SVGProps } from "react";
import type { Insight, InsightStatus } from "@/lib/insights";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoCircleIcon } from "@/components/icons";

const STATUS_META: Record<InsightStatus, { icon: ComponentType<SVGProps<SVGSVGElement>>; color: string; label: string }> = {
  good: { icon: CheckCircleIcon, color: "#0ca30c", label: "Favorável" },
  warning: { icon: AlertTriangleIcon, color: "#fab219", label: "Atenção" },
  critical: { icon: AlertCircleIcon, color: "#d03b3b", label: "Fora do esperado" },
  neutral: { icon: InfoCircleIcon, color: "var(--muted-foreground)", label: "Informativo" },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => {
        const meta = STATUS_META[insight.status];
        const Icon = meta.icon;
        return (
          <div
            key={insight.id}
            className="rounded-lg border border-border border-l-[3px] bg-card p-4"
            style={{ borderLeftColor: meta.color === "var(--muted-foreground)" ? "var(--border)" : meta.color }}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: meta.color }}>
              <Icon className="size-3.5 shrink-0" />
              {meta.label}
            </div>
            <h4 className="mt-1.5 text-sm font-medium text-foreground">{insight.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.message}</p>
            <a
              href={`/metodologia#${insight.sourceId}`}
              className="mt-2 inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Fonte e metodologia →
            </a>
          </div>
        );
      })}
    </div>
  );
}
