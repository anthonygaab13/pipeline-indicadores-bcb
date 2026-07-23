"""Camada gold: agregações de negócio, prontas pra consumo em BI/dashboard.

Usa DuckDB pra ler a tabela silver diretamente do disco (formato Delta, via a
extensão `delta`) e rodar as agregações em SQL — mesmo padrão de quem for consumir
essas tabelas depois num dashboard (Power BI, Metabase, notebook etc.).

Gera três tabelas:
- indicadores_diarios: uma linha por data, uma coluna por indicador (formato largo).
  IPCA só é reportado uma vez por mês, então fica nulo nos outros dias — isso é
  esperado, não é um bug, já que os indicadores têm granularidades diferentes.
- cambio_metricas: câmbio com variação % diária e médias móveis de 7/30 dias —
  a mesma leitura que já é usada em dashboards de "Câmbio & Comissão".
- indicadores_mensal: fechamento/média mensal de cada indicador, incluindo o IPCA
  acumulado em 12 meses (composição das variações mensais, não soma simples).

As queries ficam separadas em _queries() recebendo o nome da fonte (uma tabela/view
qualquer com as colunas de silver.indicadores) pra poderem ser testadas contra uma
view sintética em memória, sem precisar de um arquivo Delta real (ver tests/test_gold.py).
"""

import duckdb

from bcb_pipeline.config import DATA_DIR
from bcb_pipeline.silver import silver_path


def _connect() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect()
    con.sql("INSTALL delta; LOAD delta;")
    return con


def gold_path(nome: str) -> str:
    return str(DATA_DIR / "gold" / nome)


def _queries(source: str) -> dict[str, str]:
    return {
        "indicadores_diarios": f"""
            PIVOT (SELECT data, serie_slug, valor FROM {source})
            ON serie_slug IN ('cambio', 'selic', 'ipca')
            USING first(valor)
            GROUP BY data
            ORDER BY data
        """,
        "cambio_metricas": f"""
            SELECT
                data,
                valor AS cambio,
                round((valor / lag(valor) OVER (ORDER BY data) - 1) * 100, 4) AS variacao_pct_dia,
                round(avg(valor) OVER (ORDER BY data ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 4) AS media_movel_7d,
                round(avg(valor) OVER (ORDER BY data ROWS BETWEEN 29 PRECEDING AND CURRENT ROW), 4) AS media_movel_30d
            FROM {source}
            WHERE serie_slug = 'cambio'
            ORDER BY data
        """,
        "indicadores_mensal": f"""
            WITH ipca_mensal AS (
                SELECT date_trunc('month', data) AS mes, last(valor ORDER BY data) AS ipca_mensal
                FROM {source}
                WHERE serie_slug = 'ipca'
                GROUP BY 1
            ),
            cambio_mensal AS (
                SELECT date_trunc('month', data) AS mes,
                       round(avg(valor), 4) AS cambio_medio,
                       last(valor ORDER BY data) AS cambio_fechamento
                FROM {source}
                WHERE serie_slug = 'cambio'
                GROUP BY 1
            ),
            selic_mensal AS (
                SELECT date_trunc('month', data) AS mes, round(avg(valor), 4) AS selic_media
                FROM {source}
                WHERE serie_slug = 'selic'
                GROUP BY 1
            )
            SELECT
                coalesce(c.mes, s.mes, i.mes) AS mes,
                c.cambio_medio,
                c.cambio_fechamento,
                s.selic_media,
                i.ipca_mensal,
                round(
                    (exp(sum(ln(1 + i.ipca_mensal / 100.0)) OVER (
                        ORDER BY coalesce(c.mes, s.mes, i.mes) ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
                    )) - 1) * 100,
                    4
                ) AS ipca_acumulado_12m
            FROM cambio_mensal c
            FULL OUTER JOIN selic_mensal s USING (mes)
            FULL OUTER JOIN ipca_mensal i USING (mes)
            ORDER BY mes
        """,
    }


def run_gold() -> None:
    from bcb_pipeline.storage import write_overwrite

    con = _connect()
    source = f"delta_scan('{silver_path()}')"
    for nome, query in _queries(source).items():
        tabela = con.sql(query).arrow()
        write_overwrite(gold_path(nome), tabela)
    con.close()
