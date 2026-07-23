// Fórmulas financeiras puras, sem dependência de UI nem de onde o dado veio (histórico ou
// ao vivo) — usadas tanto pelas leituras automáticas (insights.ts) quanto pela calculadora
// (Calculator.tsx). Centralizar aqui evita ter a mesma conta escrita duas vezes em lugares
// diferentes. Cada função cita, no comentário, a fonte/regra que está aplicando — ver
// lib/methodology.ts e a página /metodologia pra explicação completa em linguagem simples.

// Converte a taxa diária da Selic (% a.d., como publicada pelo BCB na série SGS 11) pra
// taxa anualizada (% a.a.), assumindo 252 dias úteis no ano — mesma fórmula usada no
// export_json.py do pipeline (stats.json.selic_anualizada), repetida aqui em TypeScript
// pra não depender de reexportar dado calculado.
export function selicAnualizada(selicDiariaPct: number): number {
  return (Math.pow(1 + selicDiariaPct / 100, 252) - 1) * 100;
}

// Juro real pela fórmula de Fisher: desconta a inflação acumulada da taxa nominal
// anualizada, em vez de simplesmente subtrair os dois percentuais (subtração direta
// subestima o efeito em cenários de juro ou inflação alta).
export function jurosReais(selicAnualizadaPct: number, ipcaAcumulado12mPct: number): number {
  return ((1 + selicAnualizadaPct / 100) / (1 + ipcaAcumulado12mPct / 100) - 1) * 100;
}

// Tabela regressiva de Imposto de Renda pra aplicações de renda fixa (Lei nº 11.033/2004) —
// vale pra CDB, Tesouro Direto e fundos de renda fixa. NÃO se aplica a LCI/LCA (isentas) nem
// a poupança (isenta): ver nota na calculadora.
export function aliquotaIR(diasCorridos: number): number {
  if (diasCorridos <= 180) return 22.5;
  if (diasCorridos <= 360) return 20;
  if (diasCorridos <= 720) return 17.5;
  return 15;
}

export interface Rendimento {
  bruto: number;
  rendimentoBruto: number;
  aliquotaIR: number;
  imposto: number;
  liquido: number;
}

// Simula uma aplicação que rende 100% da Selic diária, capitalizada dia a dia — aproximação
// didática do que um CDB/Tesouro Selic pós-fixado entrega (produtos reais pagam um % do CDI,
// não exatamente a Selic; ver /metodologia).
export function simularRendimentoSelic(principal: number, selicDiariaPct: number, diasCorridos: number): Rendimento {
  const bruto = principal * Math.pow(1 + selicDiariaPct / 100, diasCorridos);
  const rendimentoBrutoValor = bruto - principal;
  const aliquota = aliquotaIR(diasCorridos);
  const imposto = rendimentoBrutoValor * (aliquota / 100);
  return {
    bruto,
    rendimentoBruto: rendimentoBrutoValor,
    aliquotaIR: aliquota,
    imposto,
    liquido: bruto - imposto,
  };
}

export type DirecaoConversao = "BRL_PARA_USD" | "USD_PARA_BRL";

// Conversão simples usando a cotação de venda do dólar (série SGS 1, a mesma usada no
// restante do dashboard) — serve pra uma estimativa rápida de "campo", não substitui a
// cotação exata de fechamento de uma operação de câmbio real (que envolve spread do banco).
export function converterCambio(valor: number, direcao: DirecaoConversao, cotacaoVenda: number): number {
  return direcao === "BRL_PARA_USD" ? valor / cotacaoVenda : valor * cotacaoVenda;
}
