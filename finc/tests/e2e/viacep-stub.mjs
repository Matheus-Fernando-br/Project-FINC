// Stub local do ViaCEP para os testes E2E (o serviço real é consultado em produção).
import http from "node:http";

const CEPS = {
  30130010: {
    cep: "30130-010",
    logradouro: "Avenida Afonso Pena",
    bairro: "Centro",
    localidade: "Belo Horizonte",
    uf: "MG",
    complemento: "",
  },
};
const port = Number(process.env.STUB_PORT ?? 3398);
http
  .createServer((req, res) => {
    const m = /^\/ws\/(\d{8})\/json\/?$/.exec(req.url ?? "");
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/health") return res.end("{}");
    if (!m) return res.writeHead(400).end(JSON.stringify({ erro: true }));
    res.end(JSON.stringify(CEPS[m[1]] ?? { erro: true }));
  })
  .listen(port, process.env.STUB_HOST ?? "127.0.0.1");
