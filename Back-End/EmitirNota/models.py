from pydantic import BaseModel
from typing import List

class ProdutoServico(BaseModel):
    item: str
    tipoNota: str
    quantidade: str
    info: str

class NotaFiscal(BaseModel):
    cliente_nome: str
    cliente_cpf: str

    incluirFrete: str

    produtosServicos: List[ProdutoServico]

    descontoIncond: float = 0
    descontoCond: float = 0
    valorTotal: float = 0
