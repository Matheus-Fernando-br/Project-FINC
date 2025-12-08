// Back-End/EmitirNota/gerarNota.js

const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

module.exports = async function gerarNotaFiscal(dados) {
  const pdfDoc = await PDFDocument.create();
  const pagina = pdfDoc.addPage([595, 842]); // A4 vertical

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawText = (text, x, y, size = 12) => {
    pagina.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  };

  // Cabeçalho da nota
  drawText("NOTA FISCAL - MODELO ILUSTRATIVO", 160, 800, 16);
  drawText("--------------------------------------------", 160, 785, 12);

  // Cliente
  drawText("Dados do Cliente:", 50, 750, 14);
  drawText(`Nome: ${dados.nomeSocial || ""}`, 50, 730);
  drawText(`CPF/CNPJ: ${dados.cpfCnpj || ""}`, 50, 710);

  // Produtos / Serviços
  drawText("Itens da Nota:", 50, 680, 14);

  let y = 660;
  dados.produtos.forEach((p, i) => {
    drawText(`${i + 1}. ${p.item} - ${p.tipoNota}`, 50, y);
    drawText(`Qtd: ${p.quantidade}`, 320, y);
    drawText(`Valor: R$ ${p.valor}`, 420, y);
    y -= 20;
  });

  // Transporte
  drawText("Transporte:", 50, y - 10, 14);
  y -= 30;

  if (dados.incluirFrete === "sim") {
    drawText(`Transportadora: ${dados.transporte.nome}`, 50, y);
    drawText(`CPF/CNPJ: ${dados.transporte.cpf}`, 50, y - 20);
    drawText(`Placa: ${dados.transporte.placa}`, 300, y);
    drawText(
      `Peso Bruto: ${dados.transporte.pesoBruto} Kg   Peso Líquido: ${dados.transporte.pesoLiquido} Kg`,
      50,
      y - 40
    );
    y -= 60;
  } else {
    drawText("Sem frete incluso.", 50, y);
    y -= 20;
  }

  // Valores finais
  drawText("Totais:", 50, y - 10, 14);
  drawText(`Desconto incondicionado: R$ ${dados.descIncond}`, 50, y - 30);
  drawText(`Desconto condicionado: R$ ${dados.descCond}`, 50, y - 50);
  drawText(`Valor Total: R$ ${dados.valorTotal}`, 50, y - 70);

  const bytes = await pdfDoc.save();
  return bytes;
};
