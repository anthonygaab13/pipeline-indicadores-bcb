// Stat tile: label + valor em destaque + delta (opcional, colorido por direção) + sparkline
// (opcional). Segue o contrato de "Figures" da skill de dataviz — número em fonte proporcional
// (não tabular), delta assinado, sparkline no tom de baixa ênfase com o trecho atual em destaque.

const SPARK_W = 96;
const SPARK_H = 28;

function sparklinePath(values: number[]): string {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return "";
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * SPARK_W;
      const y = SPARK_H - ((v - min) / range) * (SPARK_H - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function StatTile({
  label,
  value,
  deltaLabel,
  deltaDirection,
  sparkline,
  accentColor,
}: {
  label: string;
  value: string;
  deltaLabel?: string;
  /** "up-good" e "down-good" pintam o delta de acordo com o que é favorável; "neutral" fica cinza. */
  deltaDirection?: "up-good" | "down-good" | "neutral";
  sparkline?: number[];
  accentColor: string;
}) {
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
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {deltaLabel && <p className={`mt-0.5 text-xs tabular-nums ${deltaColor}`}>{deltaLabel}</p>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} aria-hidden className="shrink-0">
            <path d={sparklinePath(sparkline)} fill="none" stroke={accentColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
