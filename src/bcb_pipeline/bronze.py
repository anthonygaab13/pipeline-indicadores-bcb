"""Camada bronze: grava o dado bruto extraído da API como tabela Delta, sem tratamento.

A API do BCB devolve o histórico completo da série a cada chamada (não dá pra pedir só
"o que mudou"), então cada execução é um "full refresh": a tabela bronze é sobrescrita
(mode="overwrite") com a extração mais recente, não um log incremental. Um passo futuro
natural seria passar a paginar por data (dataInicial/dataFinal) e acumular incrementalmente.
"""

import polars as pl
from deltalake import write_deltalake

from bcb_pipeline.config import DATA_DIR, SERIES
from bcb_pipeline.extract import fetch_series


def bronze_path(slug: str) -> str:
    return str(DATA_DIR / "bronze" / slug)


def run_bronze() -> dict[str, pl.DataFrame]:
    """Extrai todas as séries configuradas e grava cada uma como tabela Delta bronze.

    Devolve os DataFrames em memória também, pra silver.py não precisar reler do disco
    dentro da mesma execução do pipeline.
    """
    resultados: dict[str, pl.DataFrame] = {}
    for series in SERIES:
        df = fetch_series(series)
        write_deltalake(bronze_path(series.slug), df.to_arrow(), mode="overwrite")
        resultados[series.slug] = df
    return resultados
