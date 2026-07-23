"use client";

// Gráfico combinado barra + linha (usado pro IPCA: variação mensal em barra, acumulado
// 12m em linha) — mesma unidade (%) nos dois, então um único eixo Y é honesto aqui
// (nunca eixo duplo — ver anti-patterns.md). Barras com hover por marca (não crosshair).

import { useState } from "react";
import {
  PAD,
  VB_HEIGHT,
  VB_WIDTH,
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

export function ComboChart({
  xLabels,
  bars,
  line,
  barColor,
  lineColor,
  barLabel,
  lineLabel,
  yFormat = "percent1",
}: {
  xLabels: string[];
  bars: number[];
  line: number[];
  barColor: string;
  lineColor: string;
  barLabel: string;
  lineLabel: string;
  yFormat?: ValueFormat;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const domain = niceDomain([...bars, ...line, 0]);
  const yTicks = niceYTicks(domain);
  const xTicks = tickIndices(xLabels.length, 5);

  const usableWidth = VB_WIDTH - PAD.left - PAD.right;
  const slot = usableWidth / xLabels.length;
  const barWidth = Math.min(24, slot * 0.5);
  const zeroY = scaleY(0, domain);

  return (
    <div className="relative w-full">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: barColor }} aria-hidden />
          {barLabel}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-[2px] w-4 rounded-full" style={{ backgroundColor: lineColor }} aria-hidden />
          {lineLabel}
        </div>
      </div>

      <svg viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} className="w-full touch-none select-none" role="img" aria-label="Gráfico de barras e linha">
        {yTicks.map((t, i) => {
          const y = VB_HEIGHT - PAD.bottom - (i / (yTicks.length - 1)) * (VB_HEIGHT - PAD.top - PAD.bottom);
          return (
            <g key={t}>
              <line x1={PAD.left} x2={VB_WIDTH - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px] tabular-nums">
                {formatValue(t, yFormat)}
              </text>
            </g>
          );
        })}

        {xTicks.map((idx) => (
          <text key={idx} x={scaleX(idx, xLabels.length)} y={VB_HEIGHT - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
            {formatDateShort(xLabels[idx])}
          </text>
        ))}

        {bars.map((v, i) => {
          const x = scaleX(i, xLabels.length) - barWidth / 2;
          const y = scaleY(v, domain);
          const top = Math.min(y, zeroY);
          const h = Math.max(1, Math.abs(zeroY - y));
          const isHover = hoverIndex === i;
          return (
            <rect
              key={i}
              x={x}
              y={top}
              width={barWidth}
              height={h}
              rx={2}
              fill={barColor}
              fillOpacity={isHover ? 1 : 0.75}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          );
        })}

        <path d={linePath(line, domain)} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hoverIndex !== null && (
          <circle
            cx={scaleX(hoverIndex, xLabels.length)}
            cy={scaleY(line[hoverIndex], domain)}
            r={4}
            fill={lineColor}
            stroke="var(--card)"
            strokeWidth={2}
          />
        )}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-40 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${(scaleX(hoverIndex, xLabels.length) / VB_WIDTH) * 100}%`,
            transform:
              scaleX(hoverIndex, xLabels.length) > VB_WIDTH * 0.7 ? "translateX(-105%)" : "translateX(12px)",
          }}
        >
          <p className="mb-1 text-muted-foreground">{formatDateShort(xLabels[hoverIndex])}</p>
          <p className="flex items-center justify-between gap-3 tabular-nums">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: barColor }} aria-hidden />
              {barLabel}
            </span>
            <span className="font-mono font-semibold text-foreground">{formatValue(bars[hoverIndex], yFormat)}</span>
          </p>
          <p className="flex items-center justify-between gap-3 tabular-nums">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-[2px] w-3 rounded-full" style={{ backgroundColor: lineColor }} aria-hidden />
              {lineLabel}
            </span>
            <span className="font-mono font-semibold text-foreground">{formatValue(line[hoverIndex], yFormat)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
