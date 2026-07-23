// Carrega os JSON estáticos exportados pelo pipeline (ver ../../../src/bcb_pipeline/export_json.py
// no repositório principal) direto do disco — roda em Server Component, então isso acontece
// em build/request time no servidor, nunca no bundle do cliente.

import fs from "node:fs";
import path from "node:path";

export interface CambioPoint {
  data: string;
  cambio: number;
  variacao_pct_dia: number | null;
  media_movel_7d: number | null;
  media_movel_30d: number | null;
}

export interface SelicPoint {
  data: string;
  selic: number;
}

export interface MensalPoint {
  mes: string;
  cambio_medio: number | null;
  cambio_fechamento: number | null;
  selic_media: number | null;
  ipca_mensal: number;
  ipca_acumulado_12m: number;
}

export interface Stats {
  cambio_data: string;
  cambio: number;
  cambio_variacao_pct_dia: number;
  selic_data: string;
  selic: number;
  selic_anualizada: number;
  ipca_mes: string;
  ipca_acumulado_12m: number;
  ipca_acumulado_12m_delta: number;
  periodo_inicio: string;
  periodo_fim: string;
}

function readJson<T>(file: string): T {
  const filePath = path.join(process.cwd(), "public", "data", file);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function loadCambio(): CambioPoint[] {
  return readJson<CambioPoint[]>("cambio.json");
}

export function loadSelic(): SelicPoint[] {
  return readJson<SelicPoint[]>("selic.json");
}

export function loadMensal(): MensalPoint[] {
  return readJson<MensalPoint[]>("mensal.json");
}

export function loadStats(): Stats {
  return readJson<Stats>("stats.json");
}
