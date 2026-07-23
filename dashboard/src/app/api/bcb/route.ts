// Proxy server-side pro SGS do Banco Central — usado pela calculadora (Calculator.tsx) pra
// pegar a cotação/Selic mais recentes já publicadas, sem depender do JSON semanal que
// alimenta os gráficos históricos. Roda no servidor (não no navegador) por dois motivos:
// 1) o BCB bloqueia o User-Agent padrão de fetch/requests (erro 406) — precisamos mandar um
//    User-Agent de navegador, igual ao pipeline Python faz em extract.py;
// 2) evita qualquer problema de CORS do lado do cliente.
// "force-dynamic" garante que essa rota sempre executa a busca de novo a cada chamada, em
// vez de cachear a resposta — é o que torna isso "ao vivo".
export const dynamic = "force-dynamic";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; bcb-pipeline-dashboard/0.1; +https://github.com/anthonygaab13)",
};

interface PontoBcb {
  data: string;
  valor: string;
}

async function ultimoValor(codigo: number): Promise<{ data: string; valor: number }> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`;
  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`BCB respondeu ${res.status} para a série ${codigo}`);
  }
  const body = (await res.json()) as PontoBcb[];
  const ponto = body[0];
  if (!ponto) {
    throw new Error(`BCB não retornou dado pra série ${codigo}`);
  }
  return { data: ponto.data, valor: Number(ponto.valor.replace(",", ".")) };
}

export async function GET() {
  try {
    const [cambio, selic] = await Promise.all([ultimoValor(1), ultimoValor(11)]);
    return Response.json({ cambio, selic, consultadoEm: new Date().toISOString() });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha ao consultar o Banco Central";
    return Response.json({ error: mensagem }, { status: 502 });
  }
}
