// Matemática de escala compartilhada pelos gráficos SVG customizados (LineChart, ComboChart).
// Sem biblioteca de gráficos — construídos à mão seguindo a skill de dataviz (traços finos,
// eixos discretos, crosshair). O viewBox é uma grade fixa (0..VB_WIDTH x 0..VB_HEIGHT) que o
// SVG escala pra qualquer largura de tela via width="100%".

export const VB_WIDTH = 960;
export const VB_HEIGHT = 320;
export const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

export function scaleX(index: number, count: number): number {
  if (count <= 1) return PAD.left;
  const usable = VB_WIDTH - PAD.left - PAD.right;
  return PAD.left + (index / (count - 1)) * usable;
}

export function scaleY(value: number, [min, max]: [number, number]): number {
  const usable = VB_HEIGHT - PAD.top - PAD.bottom;
  if (max === min) return VB_HEIGHT - PAD.bottom;
  const t = (value - min) / (max - min);
  return VB_HEIGHT - PAD.bottom - t * usable;
}

export function niceDomain(values: number[], padFraction = 0.08): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * padFraction;
  return [min - pad, max + pad];
}

export function linePath(
  values: (number | null)[],
  domain: [number, number],
): string {
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      drawing = false;
      return;
    }
    const x = scaleX(i, values.length);
    const y = scaleY(v, domain);
    d += drawing ? ` L ${x.toFixed(2)} ${y.toFixed(2)}` : `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    drawing = true;
  });
  return d;
}

export function formatDateShort(iso: string): string {
  const [year, month] = iso.split("-");
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[Number(month) - 1]}/${year.slice(2)}`;
}

export function formatDateFull(iso: string): string {
  const [year, month, day] = iso.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(day)} de ${meses[Number(month) - 1]} de ${year}`;
}

// Presets de formatação (em vez de aceitar uma função como prop): LineChart/ComboChart
// são Client Components recebendo dados de um Server Component (page.tsx) — funções não
// atravessam essa fronteira (não são serializáveis), só valores simples como este union type.
export type ValueFormat = "decimal2" | "decimal3" | "percent1" | "percent2" | "percent3";

export function formatValue(v: number, format: ValueFormat = "decimal2"): string {
  switch (format) {
    case "decimal2":
      return v.toFixed(2);
    case "decimal3":
      return v.toFixed(3);
    case "percent1":
      return `${v.toFixed(1)}%`;
    case "percent2":
      return `${v.toFixed(2)}%`;
    case "percent3":
      return `${v.toFixed(3)}%`;
  }
}

/** Escolhe ~5 índices igualmente espaçados pra rotular o eixo X sem lotar de texto. */
export function tickIndices(count: number, maxTicks = 6): number[] {
  if (count <= maxTicks) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (maxTicks - 1);
  return Array.from({ length: maxTicks }, (_, i) => Math.round(i * step));
}

export function niceYTicks(domain: [number, number], count = 4): number[] {
  const [min, max] = domain;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}
