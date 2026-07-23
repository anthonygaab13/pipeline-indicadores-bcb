"""Exporta as tabelas gold (Delta) para JSON estático, consumido pelo dashboard
(pasta dashboard/, um app Next.js separado, publicado à parte na Vercel). Roda
depois da pipeline principal — ver .github/workflows/refresh-data.yml — pra
manter o dashboard sempre com os dados mais recentes sem o app precisar ler
Delta/Parquet em runtime (os JSON ficam em dashboard/public/data, servidos
como arquivo estático).

Uso: python -m bcb_pipeline.export_json
"""

import json
from pathlib import Path

import duckdb

from bcb_pipeline.gold import gold_path
from bcb_pipeline.silver import silver_path

OUT_DIR = Path(__file__).resolve().parents[2] / "dashboard" / "public" / "data"


def _dump(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, default=str, ensure_ascii=False, separators=(",", ":"))


def run_export() -> None:
    con = duckdb.connect()
    con.sql("INSTALL delta; LOAD delta;")

    cambio = con.sql(f"""
        SELECT data, cambio, variacao_pct_dia, media_movel_7d, media_movel_30d
        FROM delta_scan('{gold_path("cambio_metricas")}')
        ORDER BY data
    """).pl().to_dicts()
    _dump(OUT_DIR / "cambio.json", cambio)

    selic = con.sql(f"""
        SELECT data, selic
        FROM delta_scan('{gold_path("indicadores_diarios")}')
        WHERE selic IS NOT NULL
        ORDER BY data
    """).pl().to_dicts()
    _dump(OUT_DIR / "selic.json", selic)

    mensal = con.sql(f"""
        SELECT mes, cambio_medio, cambio_fechamento, selic_media, ipca_mensal, ipca_acumulado_12m
        FROM delta_scan('{gold_path("indicadores_mensal")}')
        WHERE ipca_mensal IS NOT NULL
        ORDER BY mes
    """).pl().to_dicts()
    _dump(OUT_DIR / "mensal.json", mensal)

    # Números de destaque (stat tiles) — pré-calculados aqui pra não recalcular no cliente.
    stats = con.sql(f"""
        WITH ultimo_cambio AS (
            SELECT data, cambio, variacao_pct_dia
            FROM delta_scan('{gold_path("cambio_metricas")}')
            ORDER BY data DESC LIMIT 1
        ),
        ultima_selic AS (
            SELECT data, selic, (pow(1 + selic / 100.0, 252) - 1) * 100 AS selic_anualizada
            FROM delta_scan('{gold_path("indicadores_diarios")}')
            WHERE selic IS NOT NULL
            ORDER BY data DESC LIMIT 1
        ),
        ipca_recente AS (
            SELECT mes, ipca_acumulado_12m,
                   lag(ipca_acumulado_12m) OVER (ORDER BY mes) AS ipca_acumulado_12m_anterior
            FROM delta_scan('{gold_path("indicadores_mensal")}')
            WHERE ipca_acumulado_12m IS NOT NULL
            QUALIFY row_number() OVER (ORDER BY mes DESC) = 1
        ),
        janela AS (
            SELECT min(data) AS inicio, max(data) AS fim
            FROM delta_scan('{silver_path()}')
        )
        SELECT
            uc.data AS cambio_data, uc.cambio, uc.variacao_pct_dia AS cambio_variacao_pct_dia,
            us.data AS selic_data, us.selic, round(us.selic_anualizada, 2) AS selic_anualizada,
            ic.mes AS ipca_mes, ic.ipca_acumulado_12m,
            round(ic.ipca_acumulado_12m - ic.ipca_acumulado_12m_anterior, 2) AS ipca_acumulado_12m_delta,
            j.inicio AS periodo_inicio, j.fim AS periodo_fim
        FROM ultimo_cambio uc, ultima_selic us, ipca_recente ic, janela j
    """).pl().to_dicts()
    _dump(OUT_DIR / "stats.json", stats[0])

    con.close()


if __name__ == "__main__":
    run_export()
    print(f"Dados exportados para {OUT_DIR}")
