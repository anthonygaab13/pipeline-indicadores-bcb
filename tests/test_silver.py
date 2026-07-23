import polars as pl
import pytest

from bcb_pipeline.silver import _clean_series


def _bronze_like(rows: list[dict]) -> pl.DataFrame:
    return pl.DataFrame(rows)


def test_clean_series_parses_dates_and_decimal_dot():
    raw = _bronze_like(
        [
            {"data": "02/01/2024", "valor": "4.857", "serie_slug": "cambio"},
            {"data": "03/01/2024", "valor": "4.901", "serie_slug": "cambio"},
        ]
    )

    cleaned = _clean_series(raw, "Câmbio (USD/BRL)")

    assert cleaned["data"].dtype == pl.Date
    assert cleaned["valor"].dtype == pl.Float64
    assert cleaned.sort("data")["valor"].to_list() == [4.857, 4.901]
    assert set(cleaned["indicador"].to_list()) == {"Câmbio (USD/BRL)"}


def test_clean_series_accepts_comma_as_decimal_separator():
    raw = _bronze_like([{"data": "02/01/2024", "valor": "4,857", "serie_slug": "cambio"}])

    cleaned = _clean_series(raw, "Câmbio (USD/BRL)")

    assert cleaned["valor"].to_list() == [4.857]


def test_clean_series_deduplicates_keeping_last_occurrence():
    raw = _bronze_like(
        [
            {"data": "02/01/2024", "valor": "1.000", "serie_slug": "cambio"},
            {"data": "02/01/2024", "valor": "2.000", "serie_slug": "cambio"},  # correção da mesma data
        ]
    )

    cleaned = _clean_series(raw, "Câmbio (USD/BRL)")

    assert cleaned.height == 1
    assert cleaned["valor"].to_list() == [2.000]


def test_clean_series_raises_when_value_cannot_be_parsed():
    raw = _bronze_like([{"data": "02/01/2024", "valor": "não é número", "serie_slug": "cambio"}])

    with pytest.raises(ValueError):
        _clean_series(raw, "Câmbio (USD/BRL)")
