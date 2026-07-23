"use client";

// Gráfico de linha customizado (SVG à mão, sem lib de gráficos), seguindo a skill de dataviz:
// linhas de 2px, eixos/gridlines em cinza recessivo e hairline, crosshair vertical que
// "gruda" no ponto de dado mais próximo, tooltip com todas as séries daquele X, legenda
// só quando há 2+ séries. Ver components/charts/chart-utils.ts pra escala/matemática.

import { useId, useRef, useState } from "react";
import {
  PAD,
  VB_HEIGHT,
  VB_WIDTH,
  areaPath,
  formatDateFull,
  formatDateShort,
  formatValue,
  linePath,
  niceDomain,
  niceYTicks,
  scaleX,
  scaleY,
  tickIndices,
  type ValueFormat,
} from "./chart-utils";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  opacity?: number;
  data: (number | null)[];
  /** Preenche a área sob a linha com um gradiente que desvanece pra transparente — usar só
   * na série em destaque (ex: a linha principal, não médias móveis auxiliares). */
  areaFill?: boolean;
}

export function LineChart({
  xLabels,
  series,
  yFormat = "decimal2",
  yDomain,
}: {
  xLabels: string[];
  series: LineSeries[];
  yFormat?: ValueFormat;
  yDomain?: [number, number];
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const allValues = series.flatMap((s) => s.data.filter((v): v is number => v !== null));
  const domain = yDomain ?? niceDomain(allValues);
  const yTicks = niceYTicks(domain);
  const xTicks = tickIndices(xLabels.length);

  function handleMove(clientX: number) {
    const svg = svgRef.current;
    if (!svg || xLabels.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * VB_WIDTH;
    const usable = VB_WIDTH - PAD.left - PAD.right;
    const t = Math.min(1, Math.max(0, (relX - PAD.left) / usable));
    const idx = Math.round(t * (xLabels.length - 1));
    setHoverIndex(Math.min(xLabels.length - 1, Math.max(0, idx)));
  }

  const hoverX = hoverIndex !== null ? scaleX(hoverIndex, xLabels.length) : null;

  return (
    <div className="relative w-full">
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-[2px] w-4 rounded-full"
                style={{ backgroundColor: s.color, opacity: s.opacity ?? 1 }}
                aria-hidden
              />
              {s.label}
            </div>
          ))}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label="Gráfico de linha"
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        {series.some((s) => s.areaFill) && (
          <defs>
            {series
              .filter((s) => s.areaFill)
              .map((s) => (
                <linearGradient key={s.key} id={`${uid}-area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
          </defs>
        )}

        {yTicks.map((t, i) => {
          const y = VB_HEIGHT - PAD.bottom - (i / (yTicks.length - 1)) * (VB_HEIGHT - PAD.top - PAD.bottom);
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={VB_WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                {formatValue(t, yFormat)}
              </text>
            </g>
          );
        })}

        {xTicks.map((idx) => (
          <text
            key={idx}
            x={scaleX(idx, xLabels.length)}
            y={VB_HEIGHT - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {formatDateShort(xLabels[idx])}
          </text>
        ))}

        {series.map(
          (s) =>
            s.areaFill && <path key={`${s.key}-area`} d={areaPath(s.data, domain)} fill={`url(#${uid}-area-${s.key})`} stroke="none" />,
        )}

        {series.map((s) => (
          <path
            key={s.key}
            d={linePath(s.data, domain)}
            fill="none"
            stroke={s.color}
            strokeOpacity={s.opacity ?? 1}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {hoverX !== null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={PAD.top}
            y2={VB_HEIGHT - PAD.bottom}
            stroke="var(--foreground)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        )}

        {hoverIndex !== null &&
          series.map((s) => {
            const v = s.data[hoverIndex];
            if (v === null) return null;
            return (
              <circle
                key={s.key}
                cx={scaleX(hoverIndex, xLabels.length)}
                cy={scaleY(v, domain)}
                r={4}
                fill={s.color}
                fillOpacity={s.opacity ?? 1}
                stroke="var(--card)"
                strokeWidth={2}
              />
            );
          })}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-40 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${(hoverX! / VB_WIDTH) * 100}%`,
            transform: hoverX! > VB_WIDTH * 0.7 ? "translateX(-105%)" : "translateX(12px)",
          }}
        >
          <p className="mb-1 text-muted-foreground">{formatDateFull(xLabels[hoverIndex])}</p>
          {series.map((s) => {
            const v = s.data[hoverIndex];
            return (
              <p key={s.key} className="flex items-center justify-between gap-3 tabular-nums">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="inline-block h-[2px] w-3 rounded-full"
                    style={{ backgroundColor: s.color, opacity: s.opacity ?? 1 }}
                    aria-hidden
                  />
                  {s.label}
                </span>
                <span className="font-semibold text-foreground">{v === null ? "—" : formatValue(v, yFormat)}</span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
