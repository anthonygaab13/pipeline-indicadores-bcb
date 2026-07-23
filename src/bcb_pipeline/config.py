"""Configuração central do pipeline: quais séries do Banco Central ingerir.

Pra adicionar um indicador novo, basta adicionar uma entrada em SERIES —
o resto do pipeline (bronze, silver, gold) já itera sobre essa lista.
"""

from dataclasses import dataclass
from pathlib import Path

# Raiz onde as tabelas Delta (bronze/silver/gold) são gravadas.
DATA_DIR = Path(__file__).resolve().parents[2] / "data"

BCB_SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados"

# Séries diárias do SGS não aceitam consulta sem limite de data (a API devolve 406
# pedindo uma janela de no máximo 10 anos). Aplicamos essa janela em todas as séries,
# não só nas diárias, pra manter os três indicadores comparáveis no mesmo período.
LOOKBACK_YEARS = 10


@dataclass(frozen=True)
class SeriesConfig:
    codigo: int  # código da série no SGS (Sistema Gerenciador de Séries Temporais) do BCB
    slug: str  # nome curto usado nos nomes de tabela (bronze/{slug})
    nome: str  # rótulo legível, usado na coluna "indicador" da camada silver
    unidade: str  # descrição da unidade do valor, só documentação


SERIES: list[SeriesConfig] = [
    SeriesConfig(codigo=1, slug="cambio", nome="Câmbio (USD/BRL)", unidade="R$ por US$, venda"),
    SeriesConfig(codigo=11, slug="selic", nome="Selic", unidade="% ao dia"),
    SeriesConfig(codigo=433, slug="ipca", nome="IPCA", unidade="variação % mensal"),
]
