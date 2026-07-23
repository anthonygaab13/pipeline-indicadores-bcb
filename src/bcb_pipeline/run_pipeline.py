"""Orquestra o pipeline completo: bronze -> silver -> gold.

Uso: python -m bcb_pipeline.run_pipeline
"""

import logging
import time

from bcb_pipeline.bronze import run_bronze
from bcb_pipeline.gold import run_gold
from bcb_pipeline.silver import run_silver

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("bcb_pipeline")


def main() -> None:
    inicio = time.perf_counter()

    logger.info("bronze: extraindo séries da API do BCB...")
    bronze_dfs = run_bronze()
    for slug, df in bronze_dfs.items():
        logger.info("bronze/%s: %d linhas", slug, df.height)

    logger.info("silver: limpando e consolidando...")
    silver_df = run_silver(bronze_dfs)
    logger.info("silver/indicadores: %d linhas", silver_df.height)

    logger.info("gold: gerando agregações de negócio...")
    run_gold()
    logger.info("gold: indicadores_diarios, cambio_metricas, indicadores_mensal gerados")

    duracao = time.perf_counter() - inicio
    logger.info("pipeline concluído em %.1fs", duracao)


if __name__ == "__main__":
    main()
