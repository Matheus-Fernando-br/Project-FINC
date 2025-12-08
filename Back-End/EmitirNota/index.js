// Back-End/EmitirNota/index.js

const express = require("express");
const gerarNotaFiscal = require("./gerarNota");
const app = express();

app.use(express.json());

app.post("/api/emitir-nota", async (req, res) => {
  try {
    const pdfBytes = await gerarNotaFiscal(req.body);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=nota-fiscal.pdf");

    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Falha ao gerar a nota." });
  }
});

app.listen(4000, () => console.log("API rodando em http://localhost:4000"));
