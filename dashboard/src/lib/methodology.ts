// Registro central de "de onde vem esse número e como ele foi calculado". Cada leitura
// automática (insights.ts) e cada ferramenta da calculadora aponta pra uma entrada aqui via
// "id" — a página /metodologia renderiza essa lista inteira, com âncoras (#id) pra onde os
// links "Fonte e metodologia" apontam. Objetivo: qualquer número no site tem que ser
// rastreável até a fonte oficial, pra poder ser citado com segurança por quem usa isso no
// dia a dia com cliente.

export interface MethodologyEntry {
  id: string;
  title: string;
  summary: string;
  formula?: string;
  sources: { label: string; url: string }[];
}

export const methodology: MethodologyEntry[] = [
  {
    id: "fontes-dados",
    title: "Fontes de dados",
    summary:
      "Todos os indicadores vêm do SGS (Sistema Gerenciador de Séries Temporais) do Banco Central do Brasil, API pública e sem necessidade de chave/autenticação. Cada série tem um código oficial:",
    sources: [
      { label: "Câmbio · dólar americano (venda), diário · série 1", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json" },
      { label: "Selic · taxa diária (% a.d.) · série 11", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json" },
      { label: "IPCA · variação mensal (%) · série 433", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json" },
      { label: "SGS · página de consulta oficial", url: "https://www3.bcb.gov.br/sgspub" },
    ],
  },
  {
    id: "juro-real-fisher",
    title: "Juro real (Selic − IPCA)",
    summary:
      "Desconta a inflação acumulada em 12 meses da Selic anualizada, usando a fórmula de Fisher em vez de uma subtração direta: a subtração simples subestima o efeito real em cenários de juro ou inflação altos.",
    formula: "juro_real = [ (1 + selic_anual/100) / (1 + ipca_12m/100) − 1 ] × 100",
    sources: [{ label: "Séries Selic e IPCA · BCB SGS", url: "https://www3.bcb.gov.br/sgspub" }],
  },
  {
    id: "ipca-meta-cmn",
    title: "IPCA vs. meta de inflação",
    summary:
      "Compara o IPCA acumulado em 12 meses com a meta contínua de inflação definida pelo Conselho Monetário Nacional (CMN): centro de 3% ao ano, com banda de tolerância de 1,5 ponto percentual pra cima e pra baixo (faixa de 1,5% a 4,5%). Se o CMN alterar esses parâmetros, o site precisa ser atualizado manualmente: não é um dado buscado ao vivo.",
    sources: [{ label: "Metas para a inflação · Banco Central", url: "https://www.bcb.gov.br/controleinflacao/metainflacao" }],
  },
  {
    id: "cambio-range-percentil",
    title: "Câmbio no intervalo de 12 meses",
    summary:
      "Pega os últimos 252 pregões (~12 meses úteis) de câmbio e calcula em que percentil o valor mais recente está entre o mínimo e o máximo desse período. Não é uma opinião sobre 'caro' ou 'barato': só descreve a posição dentro do próprio histórico recente.",
    formula: "percentil = (valor_atual − mínimo_12m) / (máximo_12m − mínimo_12m) × 100",
    sources: [{ label: "Série de câmbio · BCB SGS 1", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json" }],
  },
  {
    id: "cambio-tendencia-medias",
    title: "Tendência do câmbio (curto prazo)",
    summary:
      "Compara a média móvel de 7 dias com a de 30 dias. Média de 7 dias acima da de 30 sugere viés de alta recente; abaixo sugere viés de baixa; diferença pequena (menos de 0,3%) é tratada como estável.",
    sources: [{ label: "Série de câmbio · BCB SGS 1", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json" }],
  },
  {
    id: "ciclo-selic",
    title: "Ciclo de juros (Selic)",
    summary:
      "Converte a Selic diária de 3 meses atrás e a atual pra taxa anualizada e compara as duas. Diferença acima de 0,25 p.p. ao ano é lida como ciclo de alta ou de baixa; abaixo disso, como estável.",
    sources: [{ label: "Série Selic · BCB SGS 11", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json" }],
  },
  {
    id: "conversor-cambio-ao-vivo",
    title: "Conversor de câmbio (calculadora)",
    summary:
      "Consulta o endpoint 'últimos valores' do SGS a cada acesso à calculadora, então mostra sempre a cotação mais recente publicada pelo Banco Central. O BCB divulga o câmbio uma vez por dia (fechamento), não em tempo real contínuo. Usa a cotação de venda (série 1), a mesma do restante do dashboard. Não inclui spread bancário: é uma estimativa de campo, não a taxa exata de uma operação de câmbio real.",
    sources: [{ label: "Últimos valores · série 1 (câmbio)", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json" }],
  },
  {
    id: "ir-regressivo",
    title: "Simulador de rendimento · Imposto de Renda",
    summary:
      "Simula uma aplicação rendendo 100% da Selic diária, capitalizada dia a dia, com a tabela regressiva de IR aplicada sobre o rendimento bruto: 22,5% até 180 dias, 20% de 181 a 360 dias, 17,5% de 361 a 720 dias, 15% acima de 720 dias. Essa tabela vale pra CDB, Tesouro Direto e fundos de renda fixa — LCI, LCA e poupança são isentas de IR pra pessoa física, então o valor líquido delas seria maior que o mostrado aqui. Produtos reais de mercado pagam um percentual do CDI (não exatamente a Selic) e têm taxas/spread próprios — isso aqui é uma simulação didática, não uma oferta real.",
    formula: "líquido = valor_final − (valor_final − principal) × alíquota_IR",
    sources: [
      { label: "Série Selic · BCB SGS 11", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json" },
      { label: "Lei nº 11.033/2004 (tabela regressiva de IR)", url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11.033.htm" },
    ],
  },
];

export function getMethodology(id: string): MethodologyEntry | undefined {
  return methodology.find((entry) => entry.id === id);
}
