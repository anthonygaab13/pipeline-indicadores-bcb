# Dashboard — Indicadores BCB

App Next.js que visualiza os dados gerados pela pipeline deste repositório (câmbio,
Selic e IPCA). Ao vivo em **https://indicadores-bcb.vercel.app**.

## Como os dados chegam aqui

Não lê Delta/Parquet em runtime — os dados são exportados como JSON estático em
`public/data/` pelo script `src/bcb_pipeline/export_json.py` (na raiz do repositório),
que roda depois da pipeline principal (ver `.github/workflows/refresh-data.yml`).
`src/lib/data.ts` lê esses JSON do disco em Server Components no build/request.

## Gráficos

Construídos à mão em SVG (sem lib de gráficos), seguindo as especificações de
`components/charts/`: linhas de 2px, crosshair com tooltip, legenda para múltiplas
séries, e uma paleta categórica validada contra CVD/contraste (câmbio/Selic/IPCA cada
um com sua cor fixa, nunca reaproveitada pra outra coisa).

## Como rodar localmente

```bash
npm install
npm run dev
```

Precisa que `public/data/*.json` já exista — rode a exportação primeiro (na raiz do
repositório, com o ambiente Python da pipeline ativado):

```bash
python -m bcb_pipeline.export_json
```

## Publicar

```bash
npm run build   # confirma que não quebrou
npx vercel --prod --yes
```

Como o projeto não está conectado via Git na Vercel (mesma limitação do portfólio —
conta usa login por e-mail, não GitHub), a atualização semanal automática dos dados
(`refresh-data.yml`) só atualiza o JSON no repositório. Pra refletir isso no site no
ar, é preciso rodar o `vercel --prod --yes` acima manualmente depois do refresh.
