# Pipeline de Indicadores Financeiros — Banco Central (BCB)

Pipeline de dados em arquitetura **medallion** (bronze → silver → gold) que extrai, limpa
e agrega três indicadores financeiros públicos do Banco Central do Brasil: **câmbio
(USD/BRL)**, **Selic** e **IPCA**.

Projeto construído pra praticar engenharia de dados de ponta a ponta — extração de API,
modelagem em camadas, qualidade de dados, SQL analítico e automação — usando o mesmo tipo
de raciocínio aplicado profissionalmente em dashboards de câmbio, comissão e indicadores
financeiros.

## Arquitetura

```
API do Banco Central (SGS)
        │
        ▼
   ┌─────────┐   dado bruto, como veio da API
   │ bronze  │   (uma tabela Delta por indicador)
   └────┬────┘
        │  limpeza, tipagem, deduplicação, validação
        ▼
   ┌─────────┐   tabela única em formato longo
   │ silver  │   (data, indicador, valor)
   └────┬────┘
        │  agregações de negócio via SQL (DuckDB)
        ▼
   ┌─────────┐   indicadores_diarios, cambio_metricas,
   │  gold   │   indicadores_mensal
   └─────────┘
```

- **bronze** — a resposta da API gravada quase sem tratamento, mais metadados de
  ingestão (quando, de qual série, de qual URL). É o registro fiel do que a fonte
  devolveu, pra auditoria/reprocessamento.
- **silver** — dados limpos e tipados: datas viram `date`, valores viram `float`
  (aceitando `,` ou `.` como separador decimal), duplicatas são removidas e qualquer
  linha inválida (data ou valor nulo após o tratamento) derruba o pipeline em vez de
  seguir silenciosamente com dado ruim.
- **gold** — três tabelas prontas pra consumo:
  - `indicadores_diarios`: uma linha por data, uma coluna por indicador (formato largo).
  - `cambio_metricas`: câmbio com variação % diária e médias móveis de 7 e 30 dias.
  - `indicadores_mensal`: fechamento/média mensal de cada indicador, incluindo o IPCA
    acumulado em 12 meses (composição das variações mensais, não soma simples).

Cada execução busca o **histórico completo** de cada série (a API do BCB não permite
pedir só "o que mudou"), então bronze é sobrescrita a cada rodada — é um pipeline de
*full refresh*, não incremental. Uma evolução natural seria paginar por data
(`dataInicial`/`dataFinal`) e acumular incrementalmente.

## Fonte de dados

[SGS — Sistema Gerenciador de Séries Temporais](https://www3.bcb.gov.br/sgspub) do Banco
Central, API pública e sem necessidade de chave:

| Indicador | Código SGS | Descrição |
|---|---|---|
| Câmbio | [1](https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json) | Dólar americano (venda), diário |
| Selic | [11](https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json) | Taxa Selic diária (% a.d.) |
| IPCA | [433](https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json) | Variação mensal do IPCA (%) |

## Stack técnica

- **Python 3.11+**
- [**Polars**](https://pola.rs/) — extração e limpeza (bronze → silver)
- [**DuckDB**](https://duckdb.org/) — agregações em SQL (silver → gold), lendo as tabelas
  Delta diretamente do disco via a extensão `delta`
- [**Delta Lake**](https://delta.io/) via [`delta-rs`](https://github.com/delta-io/delta-rs)
  (pacote `deltalake`) — formato de armazenamento com ACID e histórico de versões, sem
  precisar de Spark/JVM
- **pytest** + **responses** — testes automatizados, incluindo mock da API externa
- **GitHub Actions** — testes a cada push e atualização semanal automática dos dados

> Optei por não usar PySpark aqui: o dataset é uma série temporal de poucos milhares de
> linhas, então processamento distribuído seria over-engineering. DuckDB + Polars fazem o
> mesmo trabalho de forma mais leve, sem exigir um JDK instalado, mantendo o Delta Lake
> como formato de tabela de verdade.

## Como rodar localmente

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install -e ".[dev]"
python -m bcb_pipeline.run_pipeline
```

Isso gera as tabelas Delta em `data/bronze`, `data/silver` e `data/gold`. Pra explorar o
resultado rapidamente:

```python
import duckdb
duckdb.sql("INSTALL delta; LOAD delta;")
duckdb.sql("SELECT * FROM delta_scan('data/gold/cambio_metricas') ORDER BY data DESC LIMIT 10").show()
```

## Testes

```bash
pytest
```

Cobrem: parsing da resposta da API (com mock, sem chamada real), regras de limpeza da
camada silver (datas, decimais, deduplicação, validação) e as agregações SQL da camada
gold (contra dados sintéticos, sem depender de arquivo Delta real).

## Automação

- `.github/workflows/ci.yml` — roda os testes a cada push/PR.
- `.github/workflows/refresh-data.yml` — roda o pipeline completo semanalmente e commita
  as tabelas atualizadas, mantendo os dados do repositório sempre recentes sem
  intervenção manual.

## Estrutura

```
src/bcb_pipeline/
  config.py         # séries do BCB a ingerir — adicionar uma nova é só um item na lista
  extract.py         # chamada à API do BCB
  bronze.py           # grava dado bruto como tabela Delta
  silver.py            # limpeza, tipagem, deduplicação, validação
  gold.py                # agregações de negócio via DuckDB
  run_pipeline.py          # orquestra bronze -> silver -> gold
tests/                     # testes unitários de cada camada
data/                      # tabelas Delta geradas (bronze/silver/gold)
```

## Próximos passos possíveis

- Ingestão incremental por data em vez de full refresh.
- Mais indicadores (ex: PIB, desemprego, outras taxas de câmbio).
- Um pequeno dashboard (Streamlit) consumindo diretamente as tabelas gold.
