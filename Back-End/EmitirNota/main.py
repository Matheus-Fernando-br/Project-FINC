from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import NotaFiscal
from pdf_generator import gerar_pdf
import json, os

app = FastAPI()

# Permitir seu front React acessar o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # depois posso limitar ao seu domínio react
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_FILE = "storage.json"

def salvar_dados(data):
    with open(STORAGE_FILE, "w", encoding="utf8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def carregar_dados():
    try:
        with open(STORAGE_FILE, "r", encoding="utf8") as f:
            return json.load(f)
    except:
        return {}

@app.post("/salvar-dados")
def salvar_nota(nota: NotaFiscal):
    salvar_dados(nota.dict())
    return {"status": "ok"}

@app.get("/obter-dados")
def obter_dados():
    return carregar_dados()

@app.get("/gerar-pdf")
def gerar_pdf_nota():
    dados = carregar_dados()
    nome_pdf = gerar_pdf(dados)
    return {"pdf_url": f"https://{os.getenv('RAILWAY_STATIC_URL')}/{nome_pdf}"}
