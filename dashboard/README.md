# Dashboard · Indicadores BCB

App Next.js que visualiza os dados gerados pela pipeline deste repositório (câmbio,
Selic e IPCA). Ao vivo em **https://indicadores-bcb.vercel.app**.

## Como os dados chegam aqui

Não lê Delta/Parquet em runtime: os dados são exportados como JSON estático em
`public/data/` pelo script `src/bcb_pipeline/export_json.py` (na raiz do repositório),
que roda depois da pipeline principal (ver `.github/workflows/refresh-data.yml`).
`src/lib/data.ts` lê esses JSON do disco em Server Components no build/request.

## Gráficos

Construídos à mão em SVG (sem lib de gráficos), seguindo as especificações de
`components/charts/`: linhas de 2px, crosshair com tooltip, legenda para múltiplas
séries, e uma paleta categórica validada contra CVD/contraste (câmbio/Selic/IPCA cada
um com sua cor fixa, nunca reaproveitada pra outra coisa).

## Insights, calculadora e metodologia

Além dos gráficos, o dashboard tem três peças pensadas pro uso de quem trabalha com clientes
no dia a dia (assessor/gestor de investimentos):

- **Leituras automáticas** (`lib/insights.ts` + `components/InsightsPanel.tsx`): frases
  prontas calculadas em cima das tabelas gold: juro real (Selic − IPCA pela fórmula de
  Fisher), IPCA vs. meta do Banco Central, posição do câmbio no intervalo de 12 meses,
  tendência de curto prazo e ciclo da Selic. Matemática direta, sem IA/ML.
- **Calculadora** (`components/Calculator.tsx`): conversor de câmbio e simulador de
  rendimento (Selic, com IR regressivo), consultando a cotação/Selic **mais recentes** direto
  da API do BCB a cada acesso, via `app/api/bcb/route.ts` (essa rota roda no servidor porque o
  BCB bloqueia o User-Agent padrão de fetch e pra evitar CORS no navegador). Se a consulta
  falhar, cai pro último valor do histórico com aviso visual: nunca mostra número sem dizer
  se é ao vivo ou não.
- **Metodologia** (`app/metodologia/page.tsx` + `lib/methodology.ts`): página pública com
  toda fonte (código da série SGS) e toda fórmula usada no site. Cada leitura automática e a
  calculadora linkam pra seção correspondente, pra qualquer número aqui ser rastreável até a
  fonte oficial.

## Como rodar localmente

```bash
npm install
npm run dev
```

Precisa que `public/data/*.json` já exista. Rode a exportação primeiro (na raiz do
repositório, com o ambiente Python da pipeline ativado):

```bash
python -m bcb_pipeline.export_json
```

## Publicar

```bash
npm run build   # confirma que não quebrou
npx vercel --prod --yes
```

Como o projeto não está conectado via Git na Vercel (mesma limitação do portfólio,
conta usa login por e-mail, não GitHub), a atualização semanal automática dos dados
(`refresh-data.yml`) só atualiza o JSON no repositório. Pra refletir isso no site no
ar, é preciso rodar o `vercel --prod --yes` acima manualmente depois do refresh.
