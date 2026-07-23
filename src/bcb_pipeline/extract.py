"""Extração: busca os dados brutos da API pública do Banco Central (SGS)."""

from datetime import date, datetime, timedelta, timezone

import polars as pl
import requests

from bcb_pipeline.config import BCB_SGS_URL, LOOKBACK_YEARS, SeriesConfig

# O edge da API do BCB devolve 406 pra requisições sem um User-Agent de navegador.
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; bcb-pipeline/0.1; +https://github.com/anthonygaab13)"}


def _janela_consulta(hoje: date | None = None) -> tuple[str, str]:
    """Calcula (dataInicial, dataFinal) no formato dd/mm/aaaa exigido pela API.

    Séries diárias do SGS recusam consulta sem limite de data (a API devolve 406
    pedindo uma janela de no máximo 10 anos), então sempre pedimos um intervalo
    explícito — um dia a menos que LOOKBACK_YEARS, como margem de segurança.
    """
    fim = hoje or date.today()
    inicio = fim.replace(year=fim.year - LOOKBACK_YEARS) + timedelta(days=1)
    return inicio.strftime("%d/%m/%Y"), fim.strftime("%d/%m/%Y")


def fetch_series(series: SeriesConfig, timeout: int = 30) -> pl.DataFrame:
    """Busca o histórico dos últimos LOOKBACK_YEARS anos de uma série no SGS.

    A API devolve uma lista de objetos {"data": "dd/mm/aaaa", "valor": "1234.56"}
    (ambos como string) — aqui só empacotamos isso como veio, sem tratar nada.
    Tratamento/tipagem fica pra camada silver (ver silver.py).
    """
    url = BCB_SGS_URL.format(codigo=series.codigo)
    data_inicial, data_final = _janela_consulta()
    params = {"formato": "json", "dataInicial": data_inicial, "dataFinal": data_final}

    response = requests.get(url, headers=_HEADERS, params=params, timeout=timeout)
    response.raise_for_status()
    registros = response.json()

    if not registros:
        raise ValueError(f"API do BCB devolveu resposta vazia para a série {series.codigo} ({series.slug})")

    df = pl.DataFrame(registros)  # colunas: data (str), valor (str)
    return df.with_columns(
        pl.lit(series.codigo).alias("serie_codigo"),
        pl.lit(series.slug).alias("serie_slug"),
        pl.lit(response.url).alias("fonte_url"),
        pl.lit(datetime.now(timezone.utc)).alias("ingerido_em"),
    )
