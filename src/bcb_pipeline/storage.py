"""Escrita compartilhada nas tabelas Delta, usada por bronze/silver/gold.

Como esse pipeline é sempre "full refresh" (cada execução recalcula a tabela
inteira, não é incremental), não precisamos do histórico de versões que o Delta
Lake mantém por padrão pra permitir "viajar no tempo". Sem um vacuum, cada
execução semanal deixaria os arquivos parquet da versão anterior no repositório
pra sempre, fazendo o tamanho crescer sem necessidade. Por isso, toda escrita
aqui já limpa a versão anterior na hora (retention_hours=0).
"""

from deltalake import DeltaTable, write_deltalake


def write_overwrite(path: str, data) -> None:
    write_deltalake(path, data, mode="overwrite")
    DeltaTable(path).vacuum(retention_hours=0, dry_run=False, enforce_retention_duration=False)
