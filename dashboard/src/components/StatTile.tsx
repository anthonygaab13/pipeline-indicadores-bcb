// Stat tile: label + valor em destaque (com leve glow no acento, identidade "Aurora") + delta
// (opcional, colorido por direção) + sparkline com preenchimento em gradiente. Segue o
// contrato de "Figures" da skill de dataviz — número em fonte proporcional (não tabular),
// delta assinado, sparkline no tom de baixa ênfase com o trecho atual em destaque.

import { useId } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

const SPARK_W = 96;
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
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <div>
          <p
            className="text-2xl font-semibold text-foreground"
            style={{ textShadow: `0 0 20px color-mix(in srgb, ${accentColor} 45%, transparent)` }}
          >
            <AnimatedNumber value={numericValue} decimals={decimals} prefix={prefix} suffix={suffix} />
          </p>
          {deltaLabel && <p className={`mt-0.5 text-xs tabular-nums ${deltaColor}`}>{deltaLabel}</p>}
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
