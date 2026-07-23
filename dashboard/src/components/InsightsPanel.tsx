// Grade de cards com as leituras automáticas calculadas em lib/insights.ts. Componente de
// servidor puro (sem "use client") — só renderiza texto, não precisa de interatividade.
//
// Cores de status seguem a paleta fixa "good/warning/serious/critical" da skill de dataviz
// (nunca reaproveitada pra série de gráfico) e vêm sempre acompanhadas de ícone + rótulo em
// texto — nunca só a cor — pra quem não distingue bem cor também identificar o status.

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
          <div key={insight.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: meta.color }}>
              <Icon className="size-3.5 shrink-0" />
              {meta.label}
            </div>
            <h4 className="mt-1.5 text-sm font-medium text-foreground">{insight.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.message}</p>
          </div>
        );
      })}
    </div>
  );
}
