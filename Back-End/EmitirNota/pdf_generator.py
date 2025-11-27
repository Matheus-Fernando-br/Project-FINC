from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import time

def gerar_pdf(dados):
    nome = f"nota_{int(time.time())}.pdf"
    caminho = f"./public/{nome}"

    c = canvas.Canvas(caminho, pagesize=A4)
    w, h = A4

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, h - 50, "NOTA FISCAL")

    c.setFont("Helvetica", 12)
    y = h - 100
    c.drawString(50, y, f"Cliente: {dados.get('cliente_nome')}")
    y -= 20
    c.drawString(50, y, f"CPF/CNPJ: {dados.get('cliente_cpf')}")
    y -= 40

    for p in dados.get("produtosServicos", []):
        c.drawString(50, y,
            f"- {p['item']} | Tipo: {p['tipoNota']} | Quantidade: {p['quantidade']}")
        y -= 20

    c.save()
    return nome
