// Stat tile: label em mono (identidade "Boletim") + valor grande em serifada (Fraunces,
// mesma família do título — trata o número como manchete) + delta prefixado com Δ +
// sparkline com preenchimento em gradiente. Barra de acento à esquerda usa a cor da
// própria série (accentColor), reforçando a mesma cor do sparkline e do glow. Segue o
// contrato de "Figures" da skill de dataviz — delta assinado, sparkline no tom de baixa
// ênfase com o trecho atual em destaque.
//
// SPARK_W enxuto de propósito: sobra menos largura pro valor no mesmo card do que na
// versão anterior (Geist Sans), então reduzir a sparkline é mais barato que estourar
// o layout com o valor quebrando linha.

import { useId } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

const SPARK_W = 80;
const SPARK_H = 28;

function sparklinePoints(values: number[]): { x: number; y: number }[] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return [];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min || 1;
  return values.map((v, i) => ({
    x: (i / (values.length - 1)) * SPARK_W,
    y: SPARK_H - ((v - min) / range) * (SPARK_H - 4) - 2,
  }));
}

function sparklinePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

function sparklineAreaPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${sparklinePath(points)} L ${last.x.toFixed(1)} ${SPARK_H} L ${first.x.toFixed(1)} ${SPARK_H} Z`;
}

export function StatTile({
  label,
  numericValue,
  decimals = 2,
  prefix = "",
  suffix = "",
  deltaLabel,
  deltaDirection,
  sparkline,
  accentColor,
}: {
  label: string;
  /** Número puro (não string já formatada) — assim o AnimatedNumber consegue contar até ele. */
  numericValue: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  deltaLabel?: string;
  /** "up-good" e "down-good" pintam o delta de acordo com o que é favorável; "neutral" fica cinza. */
  deltaDirection?: "up-good" | "down-good" | "neutral";
  sparkline?: number[];
  accentColor: string;
}) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  const points = sparkline ? sparklinePoints(sparkline) : [];

  const deltaColor =
    deltaDirection === "neutral" || !deltaDirection
      ? "text-muted-foreground"
      : deltaLabel?.startsWith("-")
        ? deltaDirection === "down-good"
          ? "text-[#0ca30c]"
          : "text-[#d03b3b]"
        : deltaDirection === "up-good"
          ? "text-[#0ca30c]"
          : "text-[#d03b3b]";

  return (
    <div className="rounded-lg border border-border border-l-[3px] bg-card p-4" style={{ borderLeftColor: accentColor }}>
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className="font-serif text-xl font-semibold text-foreground whitespace-nowrap"
            style={{ textShadow: `0 0 20px color-mix(in srgb, ${accentColor} 45%, transparent)` }}
          >
            <AnimatedNumber value={numericValue} decimals={decimals} prefix={prefix} suffix={suffix} />
          </p>
          {deltaLabel && (
            <p className={`mt-0.5 font-mono text-xs tabular-nums ${deltaColor}`}>
              <span aria-hidden>Δ </span>
              {deltaLabel}
            </p>
          )}
        </div>
        {points.length > 1 && (
          <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} aria-hidden className="shrink-0">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={sparklineAreaPath(points)} fill={`url(#${gradientId})`} stroke="none" />
            <path d={sparklinePath(points)} fill="none" stroke={accentColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
