// Calculadora de campo: conversor de câmbio + simulador de rendimento da Selic, pensada pro
// uso rápido de quem trabalha com clientes no dia a dia (não precisa abrir planilha pra uma
// conta simples). Busca a cotação/Selic mais recentes na API do BCB assim que a página abre
// (via /api/bcb, ver esse arquivo pra entender por que isso não roda direto no navegador) —
// se a busca falhar por qualquer motivo, cai pro último valor do histórico (mesmo dado que
// os cards do topo da página já mostram), com um aviso visual de que não é mais "ao vivo".
//
// Client Component porque tem estado (inputs, toggle) e um efeito de busca ao montar — o
// resto do dashboard é só leitura, então essa é a única parte que roda de fato no navegador.

"use client";

import { useEffect, useState } from "react";
import { converterCambio, selicAnualizada, simularRendimentoSelic, type DirecaoConversao } from "@/lib/finance";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });

const PRAZOS_RAPIDOS = [30, 90, 180, 365, 720];

interface DadosMercado {
  cambio: number;
  cambioData: string;
  selicDiaria: number;
  selicData: string;
}

interface RespostaBcb {
  cambio: { data: string; valor: number };
  selic: { data: string; valor: number };
  consultadoEm: string;
}

type StatusConsulta = "carregando" | "ao-vivo" | "indisponivel";

export function Calculator({ fallback }: { fallback: DadosMercado }) {
  const [live, setLive] = useState<DadosMercado | null>(null);
  const [status, setStatus] = useState<StatusConsulta>("carregando");
  const [consultadoEm, setConsultadoEm] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/bcb")
      .then((res) => {
        if (!res.ok) throw new Error("BCB indisponível");
        return res.json() as Promise<RespostaBcb>;
      })
      .then((body) => {
        if (cancelado) return;
        setLive({
          cambio: body.cambio.valor,
          cambioData: body.cambio.data,
          selicDiaria: body.selic.valor,
          selicData: body.selic.data,
        });
        setConsultadoEm(body.consultadoEm);
        setStatus("ao-vivo");
      })
      .catch(() => {
        if (!cancelado) setStatus("indisponivel");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const dados = live ?? fallback;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span
          aria-hidden
          className={`inline-block size-1.5 shrink-0 rounded-full ${
            status === "ao-vivo" ? "bg-[#0ca30c]" : status === "indisponivel" ? "bg-[#fab219]" : "animate-pulse bg-muted-foreground"
          }`}
        />
        <span className="text-muted-foreground">
          {status === "carregando" && "Consultando o Banco Central..."}
          {status === "ao-vivo" &&
            consultadoEm &&
            `Cotação ao vivo · consultada às ${new Date(consultadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
          {status === "indisponivel" && "Banco Central indisponível agora. Usando o último dado carregado no histórico."}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ConversorCambio cambio={dados.cambio} cambioData={dados.cambioData} />
        <SimuladorRendimento selicDiaria={dados.selicDiaria} selicData={dados.selicData} />
      </div>

      <a href="/metodologia" className="mt-3 inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Fonte e metodologia completa da calculadora →
      </a>
    </div>
  );
}

function ConversorCambio({ cambio, cambioData }: { cambio: number; cambioData: string }) {
  const [valor, setValor] = useState(1000);
  const [direcao, setDirecao] = useState<DirecaoConversao>("BRL_PARA_USD");

  const resultado = converterCambio(valor, direcao, cambio);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-medium text-foreground">Conversor de câmbio</h4>

      <div className="mt-3 inline-flex rounded-md border border-border p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setDirecao("BRL_PARA_USD")}
          className={`rounded px-2.5 py-1.5 transition-colors ${
            direcao === "BRL_PARA_USD" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Real → Dólar
        </button>
        <button
          type="button"
          onClick={() => setDirecao("USD_PARA_BRL")}
          className={`rounded px-2.5 py-1.5 transition-colors ${
            direcao === "USD_PARA_BRL" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Dólar → Real
        </button>
      </div>

      <label className="mt-3 block text-xs text-muted-foreground" htmlFor="conversor-valor">
        {direcao === "BRL_PARA_USD" ? "Valor em reais" : "Valor em dólares"}
      </label>
      <input
        id="conversor-valor"
        type="number"
        min={0}
        step="0.01"
        value={valor}
        onChange={(e) => setValor(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <p className="mt-3 font-mono text-2xl font-semibold text-foreground tabular-nums">
        ≈ {direcao === "BRL_PARA_USD" ? usd.format(resultado) : brl.format(resultado)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Cotação: R$ {cambio.toFixed(4)} (venda) · BCB, {cambioData}
      </p>
    </div>
  );
}

function SimuladorRendimento({ selicDiaria, selicData }: { selicDiaria: number; selicData: string }) {
  const [valor, setValor] = useState(10000);
  const [dias, setDias] = useState(365);

  const resultado = simularRendimentoSelic(valor, selicDiaria, dias);
  const anual = selicAnualizada(selicDiaria);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-medium text-foreground">Simulador de rendimento (Selic)</h4>

      <label className="mt-3 block text-xs text-muted-foreground" htmlFor="sim-valor">
        Valor aplicado
      </label>
      <input
        id="sim-valor"
        type="number"
        min={0}
        step="0.01"
        value={valor}
        onChange={(e) => setValor(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <label className="mt-3 block text-xs text-muted-foreground" htmlFor="sim-dias">
        Prazo (dias corridos)
      </label>
      <input
        id="sim-dias"
        type="number"
        min={1}
        value={dias}
        onChange={(e) => setDias(Math.max(1, Number(e.target.value) || 1))}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRAZOS_RAPIDOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setDias(p)}
            className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
              dias === p ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}d
          </button>
        ))}
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">Bruto</dt>
          <dd className="font-mono tabular-nums text-foreground">{brl.format(resultado.bruto)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">IR ({resultado.aliquotaIR}%)</dt>
          <dd className="font-mono tabular-nums text-muted-foreground">− {brl.format(resultado.imposto)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-1.5">
          <dt className="font-medium text-foreground">Líquido</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums text-foreground">{brl.format(resultado.liquido)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Selic: {anual.toFixed(2)}% a.a. ({selicDiaria.toFixed(4)}% a.d.) · BCB, {selicData}. Simulação a 100% da Selic
        com tributação padrão de renda fixa (CDB/Tesouro Selic). LCI, LCA e poupança são isentas de IR.
      </p>
    </div>
  );
}
