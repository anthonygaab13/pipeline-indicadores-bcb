"""Camada silver: limpa, tipa e valida os dados brutos, consolidando tudo numa
única tabela em formato longo (uma linha por indicador/data).

Regras de negócio aplicadas aqui (a "tradução" de dado bruto pra dado confiável):
- datas convertidas de string "dd/mm/aaaa" pra tipo date de verdade
- valores convertidos de string pra float (aceitando "," ou "." como separador decimal)
- deduplicação por (indicador, data) — a API não deveria devolver duplicatas, mas
  o pipeline não confia nisso: recalcula com base na regra de negócio, não assume
- validação: nenhuma linha com data ou valor nulo chega na tabela final
"""

import polars as pl
from deltalake import write_deltalake

from bcb_pipeline.config import DATA_DIR, SERIES
from bcb_pipeline.bronze import bronze_path


def _clean_series(df: pl.DataFrame, nome: str) -> pl.DataFrame:
    cleaned = (
        df.with_columns(
            pl.col("data").str.strptime(pl.Date, "%d/%m/%Y", strict=False).alias("data"),
            pl.col("valor").str.replace(",", ".").cast(pl.Float64, strict=False).alias("valor"),
        )
        .with_columns(pl.lit(nome).alias("indicador"))
        .select("data", "indicador", "serie_slug", "valor")
        .unique(subset=["serie_slug", "data"], keep="last")
        .sort("data")
    )

    invalidas = cleaned.filter(pl.col("data").is_null() | pl.col("valor").is_null())
    if invalidas.height > 0:
        raise ValueError(
            f"{invalidas.height} linha(s) inválida(s) (data ou valor nulo) na série '{nome}' após limpeza"
        )
    return cleaned


def silver_path() -> str:
    return str(DATA_DIR / "silver" / "indicadores")


def run_silver(bronze_dfs: dict[str, pl.DataFrame] | None = None) -> pl.DataFrame:
    """Limpa cada série bronze e consolida numa tabela silver única.

    Se `bronze_dfs` não for passado (execução isolada, sem rodar bronze antes na
    mesma sessão), lê as tabelas bronze do disco.
    """
    partes = []
    for series in SERIES:
        raw = bronze_dfs[series.slug] if bronze_dfs else pl.read_delta(bronze_path(series.slug))
        partes.append(_clean_series(raw, series.nome))

    indicadores = pl.concat(partes)
    write_deltalake(silver_path(), indicadores.to_arrow(), mode="overwrite")
    return indicadores
