// Camada de "insights": transforma os números crus das tabelas gold em frases prontas
// pra um assessor usar direto com o cliente, em vez de obrigar a pessoa a interpretar o
// gráfico sozinha. Cada função abaixo é uma regra independente — pra adicionar uma nova
// leitura, basta escrever outra função no mesmo formato e incluir na lista de computeInsights.
//
// Propositalmente simples (matemática direta, sem IA/ML): mais fácil de auditar e de
// confiar no que está sendo dito pro cliente.

import type { CambioPoint, MensalPoint, Stats } from "./data";
import { jurosReais, selicAnualizada } from "./finance";

export type InsightStatus = "good" | "warning" | "critical" | "neutral";

export interface Insight {
  id: string;
  title: string;
  message: string;
  status: InsightStatus;
  /** Aponta pra uma entrada de lib/methodology.ts — vira o link "Fonte e metodologia" no card. */
  sourceId: string;
}

// Meta de inflação contínua do CMN (Conselho Monetário Nacional), vigente desde 2025:
// centro de 3% com banda de tolerância de 1,5 p.p. (piso 1,5% / teto 4,5%). Se o CMN
// mudar a meta no futuro, é só atualizar essas duas constantes.
const IPCA_META_CENTRO = 3;
const IPCA_META_TOLERANCIA = 1.5;
const IPCA_META_BAIXO = IPCA_META_CENTRO - IPCA_META_TOLERANCIA;
const IPCA_META_ALTO = IPCA_META_CENTRO + IPCA_META_TOLERANCIA;

function insightJuroReal(stats: Stats): Insight {
  const real = jurosReais(stats.selic_anualizada, stats.ipca_acumulado_12m);

  let status: InsightStatus = "good";
  if (real <= 0) status = "critical";
  else if (real < 2) status = "warning";

  const leitura =
    status === "critical"
      ? "negativo: a Selic não está cobrindo a inflação dos últimos 12 meses."
      : status === "warning"
        ? "positivo, mas moderado."
        : "positivo e consistente — cenário favorável à renda fixa pré/pós-fixada.";

  return {
    id: "juro-real",
    title: "Juro real (Selic − IPCA)",
    message: `Juro real em ${real.toFixed(2)}% a.a. — ${leitura}`,
    status,
    sourceId: "juro-real-fisher",
  };
}

function insightIpcaMeta(stats: Stats): Insight {
  const v = stats.ipca_acumulado_12m;

  let status: InsightStatus = "good";
  if (v > IPCA_META_ALTO || v < IPCA_META_BAIXO) status = "critical";
  else if (v > IPCA_META_ALTO - 0.5 || v < IPCA_META_BAIXO + 0.5) status = "warning";

  const leitura =
    status === "critical"
      ? v > IPCA_META_ALTO
        ? `acima do teto da meta (${IPCA_META_ALTO}%).`
        : `abaixo do piso da meta (${IPCA_META_BAIXO}%).`
      : status === "warning"
        ? "dentro da meta, mas perto do limite da banda."
        : `dentro da meta de inflação (${IPCA_META_CENTRO}% ± ${IPCA_META_TOLERANCIA} p.p.).`;

  return {
    id: "ipca-meta",
    title: "IPCA vs. meta do Banco Central",
    message: `IPCA acumulado em 12 meses: ${v.toFixed(2)}% — ${leitura}`,
    status,
    sourceId: "ipca-meta-cmn",
  };
}

// Onde o câmbio atual está dentro do intervalo (mín-máx) dos últimos ~12 meses úteis.
// Não julga se está "bom" ou "ruim" (depende de quem pergunta — importador x exportador),
// só sinaliza quando está numa zona extrema, que é quando vale a pena prestar atenção.
function insightCambioRange(cambio: CambioPoint[]): Insight {
  const janela = cambio.slice(-252);
  const valores = janela.map((d) => d.cambio);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const atual = valores[valores.length - 1];
  const percentil = max > min ? ((atual - min) / (max - min)) * 100 : 50;

  let status: InsightStatus = "neutral";
  let leitura = "dentro do intervalo normal dos últimos 12 meses.";
  if (percentil >= 85) {
    status = "warning";
    leitura = "próximo da máxima dos últimos 12 meses.";
  } else if (percentil <= 15) {
    status = "warning";
    leitura = "próximo da mínima dos últimos 12 meses.";
  }

  return {
    id: "cambio-range",
    title: "Câmbio no intervalo de 12 meses",
    message: `R$ ${atual.toFixed(4)} está no percentil ${percentil.toFixed(0)} da faixa de 12 meses (R$ ${min.toFixed(2)} – R$ ${max.toFixed(2)}) — ${leitura}`,
    status,
    sourceId: "cambio-range-percentil",
  };
}

// Cruzamento simples de médias móveis (7d vs 30d) pra descrever a tendência de curtíssimo
// prazo do câmbio numa frase, sem exigir que a pessoa leia o gráfico.
function insightCambioTendencia(cambio: CambioPoint[]): Insight {
  const ultimo = cambio[cambio.length - 1];
  const m7 = ultimo.media_movel_7d;
  const m30 = ultimo.media_movel_30d;

  if (m7 == null || m30 == null) {
    return {
      id: "cambio-tendencia",
      title: "Tendência do câmbio (curto prazo)",
      message: "Histórico insuficiente pra calcular a tendência ainda.",
      status: "neutral",
      sourceId: "cambio-tendencia-medias",
    };
  }

  const diffPct = ((m7 - m30) / m30) * 100;
  let leitura = "estável, sem tendência clara de curto prazo.";
  if (diffPct > 0.3) leitura = "em alta — média de 7 dias acima da de 30 dias.";
  else if (diffPct < -0.3) leitura = "em queda — média de 7 dias abaixo da de 30 dias.";

  return {
    id: "cambio-tendencia",
    title: "Tendência do câmbio (curto prazo)",
    message: `Câmbio ${leitura}`,
    status: "neutral",
    sourceId: "cambio-tendencia-medias",
  };
}

// A conversão diária -> anualizada usada aqui (selicAnualizada, importada de ./finance) é a
// mesma fórmula aplicada no export_json.py pro stats.json — comparar os pontos mensais já
// anualizados evita que o tamanho real do movimento fique escondido atrás de casas decimais
// minúsculas da taxa diária.
function insightCicloSelic(mensal: MensalPoint[]): Insight {
  const comValor = mensal.filter((m) => m.selic_media != null);

  if (comValor.length < 4) {
    return {
      id: "ciclo-selic",
      title: "Ciclo de juros (Selic)",
      message: "Histórico insuficiente pra identificar o ciclo ainda.",
      status: "neutral",
      sourceId: "ciclo-selic",
    };
  }

  const atual = selicAnualizada(comValor[comValor.length - 1].selic_media as number);
  const tresMesesAtras = selicAnualizada(comValor[comValor.length - 4].selic_media as number);
  const diffPp = atual - tresMesesAtras;

  let leitura = "estável nos últimos 3 meses.";
  if (diffPp > 0.25) leitura = "em ciclo de alta nos últimos 3 meses.";
  else if (diffPp < -0.25) leitura = "em ciclo de baixa nos últimos 3 meses.";

  return {
    id: "ciclo-selic",
    title: "Ciclo de juros (Selic)",
    message: `Selic ${leitura} (${diffPp >= 0 ? "+" : ""}${diffPp.toFixed(2)} p.p. a.a. no período)`,
    status: "neutral",
    sourceId: "ciclo-selic",
  };
}

export function computeInsights(stats: Stats, cambio: CambioPoint[], mensal: MensalPoint[]): Insight[] {
  return [
    insightJuroReal(stats),
    insightIpcaMeta(stats),
    insightCambioRange(cambio),
    insightCambioTendencia(cambio),
    insightCicloSelic(mensal),
  ];
}
