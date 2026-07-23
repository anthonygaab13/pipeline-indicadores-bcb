from datetime import date

import responses

from bcb_pipeline.config import SeriesConfig
from bcb_pipeline.extract import _janela_consulta, fetch_series

CAMBIO = SeriesConfig(codigo=1, slug="cambio", nome="Câmbio (USD/BRL)", unidade="R$ por US$, venda")


def test_janela_consulta_fica_um_dia_abaixo_do_limite_de_10_anos():
    inicio, fim = _janela_consulta(hoje=date(2026, 7, 22))

    assert fim == "22/07/2026"
    assert inicio == "23/07/2016"  # 10 anos antes + 1 dia de margem


@responses.activate
def test_fetch_series_parses_response_and_adds_metadata():
    responses.get(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados",
        json=[
            {"data": "02/01/2024", "valor": "4.8570"},
            {"data": "03/01/2024", "valor": "4.9012"},
        ],
    )

    df = fetch_series(CAMBIO)

    assert df.height == 2
    assert set(df.columns) >= {"data", "valor", "serie_codigo", "serie_slug", "fonte_url", "ingerido_em"}
    assert df["serie_slug"].to_list() == ["cambio", "cambio"]
    assert df["serie_codigo"].to_list() == [1, 1]


@responses.activate
def test_fetch_series_raises_on_empty_response():
    responses.get(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados",
        json=[],
    )

    try:
        fetch_series(CAMBIO)
        assert False, "deveria ter levantado ValueError"
    except ValueError:
        pass
