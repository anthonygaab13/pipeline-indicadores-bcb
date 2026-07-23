from datetime import date

import duckdb
import polars as pl
import pytest

from bcb_pipeline.gold import _queries


@pytest.fixture
def con():
    """Conexão DuckDB com uma view 'silver_view' registrada a partir de dados
    sintéticos (mesmo formato da tabela silver.indicadores), sem precisar de
    um arquivo Delta real no disco.
    """
    silver = pl.DataFrame(
        {
            "data": [
                date(2024, 1, 1),
                date(2024, 1, 2),
                date(2024, 1, 3),
                date(2024, 1, 4),
                date(2024, 1, 5),
                date(2024, 1, 1),
                date(2024, 1, 1),
                date(2024, 2, 1),
            ],
            "indicador": ["Câmbio"] * 5 + ["Selic"] + ["IPCA"] * 2,
            "serie_slug": ["cambio"] * 5 + ["selic"] + ["ipca"] * 2,
            "valor": [5.00, 5.10, 5.05, 5.20, 5.15, 0.04, 0.5, 0.4],
        }
    )
    connection = duckdb.connect()
    connection.register("silver_view", silver.to_arrow())
    yield connection
    connection.close()


def test_indicadores_diarios_pivots_by_date(con):
    result = con.sql(_queries("silver_view")["indicadores_diarios"]).pl()

    linha_1_jan = result.filter(pl.col("data") == date(2024, 1, 1))
    assert linha_1_jan["cambio"].to_list() == [5.00]
    assert linha_1_jan["selic"].to_list() == [0.04]
    assert linha_1_jan["ipca"].to_list() == [0.5]

    linha_2_jan = result.filter(pl.col("data") == date(2024, 1, 2))
    assert linha_2_jan["ipca"].to_list() == [None]  # IPCA não reportado nesse dia


def test_cambio_metricas_computes_variacao_e_medias_moveis(con):
    result = con.sql(_queries("silver_view")["cambio_metricas"]).pl().sort("data")

    assert result["variacao_pct_dia"].to_list()[0] is None  # sem dia anterior
    assert result["variacao_pct_dia"].to_list()[1] == pytest.approx(2.0, abs=0.01)
    assert result["media_movel_7d"].to_list()[0] == pytest.approx(5.00)


def test_indicadores_mensal_compoe_ipca_acumulado(con):
    result = con.sql(_queries("silver_view")["indicadores_mensal"]).pl().sort("mes")

    jan = result.filter(pl.col("mes") == date(2024, 1, 1))
    assert jan["ipca_mensal"].to_list() == [0.5]
    assert jan["ipca_acumulado_12m"].to_list()[0] == pytest.approx(0.5, abs=0.001)
    assert jan["cambio_medio"].to_list()[0] == pytest.approx(5.10, abs=0.001)
    assert jan["cambio_fechamento"].to_list() == [5.15]

    fev = result.filter(pl.col("mes") == date(2024, 2, 1))
    esperado_fev = ((1.005 * 1.004) - 1) * 100
    assert fev["ipca_acumulado_12m"].to_list()[0] == pytest.approx(esperado_fev, abs=0.001)
