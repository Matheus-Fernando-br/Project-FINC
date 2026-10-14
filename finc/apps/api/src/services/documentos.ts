import PDFDocument from "pdfkit";
import { formatBRL, formatCEP, formatCpfCnpj, formatTelefone } from "@finc/shared";

/**
 * Geração do documento auxiliar (PDF) e do XML de um documento fiscal da FINC.
 * Estes arquivos NÃO são NF-e/NFS-e transmitidas à SEFAZ/Prefeitura: a transmissão exige
 * certificado digital A1 e um provedor fiscal homologado (ver docs/integracoes.md).
 */

export interface Parte {
  nome?: string;
  cpf_cnpj?: string;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  numero?: string | null;
  complemento?: string | null;
}

export interface NotaCompleta {
  id: string;
  tipo: string;
  serie: number;
  numero: number | null;
  status: string;
  ambiente: string;
  natureza_operacao: string | null;
  data_emissao: Date | string | null;
  criado_em: Date | string;
  emitente: Parte;
  destinatario: Parte;
  transporte: {
    incluir_frete?: boolean;
    nome?: string | null;
    cpf_cnpj?: string | null;
    placa?: string | null;
    peso_bruto?: number | null;
    peso_liquido?: number | null;
    info?: string | null;
  };
  valor_produtos: number;
  valor_servicos: number;
  base_icms: number;
  valor_icms: number;
  base_iss: number;
  valor_iss: number;
  valor_pis_cofins: number;
  desconto_incondicional: number;
  desconto_condicional: number;
  valor_tributos: number;
  total: number;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  itens: {
    ordem: number;
    tipo: string;
    descricao: string;
    codigo: string | null;
    categoria: string | null;
    unidade: string | null;
    ncm: string | null;
    cfop: string | null;
    codigo_servico: string | null;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
    icms: number | null;
    pis_cofins: number | null;
    aliquota_iss: number | null;
    info: string | null;
  }[];
}

export const AVISO_SEM_VALOR =
  "DOCUMENTO AUXILIAR SEM VALOR FISCAL — gerado pela FINC sem transmissão à SEFAZ/Prefeitura.";

export function numeroFormatado(n: NotaCompleta): string {
  return n.numero ? String(n.numero).padStart(9, "0") : "RASCUNHO";
}

export function nomeArquivo(n: NotaCompleta, ext: "pdf" | "xml"): string {
  const tipo = n.tipo.replace(/[^A-Za-z]/g, "").toLowerCase();
  return `finc-${tipo}-serie${n.serie}-${numeroFormatado(n)}.${ext}`;
}

function endereco(p: Parte): string {
  const linha1 = [p.logradouro, p.numero, p.complemento].filter(Boolean).join(", ");
  const linha2 = [p.bairro, p.cidade && p.uf ? `${p.cidade}/${p.uf}` : p.cidade ?? p.uf, p.cep ? `CEP ${formatCEP(p.cep)}` : ""]
    .filter(Boolean)
    .join(" — ");
  return [linha1, linha2].filter(Boolean).join("\n") || "Endereço não informado";
}

const dataBR = (d: Date | string | null) => (d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");

export function gerarPdf(n: NotaCompleta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36, info: { Title: `${n.tipo} ${numeroFormatado(n)}`, Producer: "FINC" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 72;
    const verde = "#0f766e";

    const marcaDagua = (texto: string, cor: string) => {
      doc.save();
      doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.fontSize(54).fillColor(cor).opacity(0.12).text(texto, 0, doc.page.height / 2 - 30, { width: doc.page.width, align: "center" });
      doc.restore();
      doc.opacity(1);
    };
    if (n.status === "cancelada") marcaDagua("CANCELADA", "#b91c1c");
    else if (n.status === "rascunho") marcaDagua("RASCUNHO", "#64748b");
    else marcaDagua("SEM VALOR FISCAL", "#64748b");

    doc.rect(36, 36, W, 56).fill(verde);
    doc.fillColor("#ffffff").fontSize(20).text("FINC", 48, 48);
    doc.fontSize(10).text(`Documento auxiliar de ${n.tipo}`, 48, 72);
    doc.fontSize(12).text(`Nº ${numeroFormatado(n)}  ·  Série ${n.serie}`, 300, 48, { width: W - 276, align: "right" });
    doc.fontSize(9).text(`Status: ${n.status.toUpperCase()}  ·  Ambiente: ${n.ambiente}`, 300, 68, { width: W - 276, align: "right" });

    doc.fillColor("#b45309").fontSize(8).text(AVISO_SEM_VALOR, 36, 100, { width: W, align: "center" });

    const bloco = (titulo: string, p: Parte, y: number) => {
      doc.fillColor(verde).fontSize(10).text(titulo, 36, y);
      doc.moveTo(36, y + 13).lineTo(36 + W, y + 13).strokeColor("#cbd5e1").stroke();
      doc.fillColor("#0f172a").fontSize(9);
      doc.text(`${p.nome ?? "—"}`, 36, y + 18, { continued: false });
      const ids = [
        p.cpf_cnpj ? `CPF/CNPJ: ${formatCpfCnpj(p.cpf_cnpj)}` : null,
        p.inscricao_estadual ? `IE: ${p.inscricao_estadual}` : null,
        p.inscricao_municipal ? `IM: ${p.inscricao_municipal}` : null,
        p.telefone ? `Tel.: ${formatTelefone(p.telefone)}` : null,
        p.email ? `E-mail: ${p.email}` : null,
      ].filter(Boolean);
      doc.text(ids.join("   "), { width: W });
      doc.text(endereco(p), { width: W });
      return doc.y + 10;
    };

    let y = bloco("EMITENTE", n.emitente, 118);
    y = bloco("DESTINATÁRIO / TOMADOR", n.destinatario, y);
    doc.fillColor("#0f172a").fontSize(9).text(
      `Natureza da operação: ${n.natureza_operacao ?? "—"}     Emissão: ${dataBR(n.data_emissao)}`,
      36,
      y,
      { width: W },
    );
    y = doc.y + 12;

    // Tabela de itens
    const cols = [
      { t: "#", w: 18 },
      { t: "Descrição", w: 170 },
      { t: n.tipo === "NFS-e" ? "Cód. serv." : "NCM/CFOP", w: 80 },
      { t: "Un.", w: 40 },
      { t: "Qtd.", w: 40 },
      { t: "V. unit.", w: 60 },
      { t: n.tipo === "NFS-e" ? "ISS %" : "ICMS %", w: 45 },
      { t: "Subtotal", w: W - 453 },
    ];
    const linha = (vals: string[], yy: number, header = false) => {
      let x = 36;
      doc.fontSize(8).fillColor(header ? "#ffffff" : "#0f172a");
      vals.forEach((v, i) => {
        const c = cols[i]!;
        doc.text(v, x + 2, yy + 3, { width: c.w - 4, align: i >= 4 ? "right" : "left", lineBreak: !header && i === 1 });
        x += c.w;
      });
    };
    doc.rect(36, y, W, 16).fill(verde);
    linha(cols.map((c) => c.t), y, true);
    y += 18;
    for (const it of n.itens) {
      if (y > doc.page.height - 200) {
        doc.addPage();
        y = 36;
      }
      const fiscal = it.tipo === "servico" ? it.codigo_servico ?? "" : `${it.ncm ?? ""}/${it.cfop ?? ""}`;
      const aliq = it.tipo === "servico" ? it.aliquota_iss : it.icms;
      linha(
        [String(it.ordem), it.descricao + (it.info ? ` — ${it.info}` : ""), fiscal, it.unidade ?? "", String(it.quantidade),
          formatBRL(it.valor_unitario), aliq === null ? "—" : String(aliq), formatBRL(it.subtotal)],
        y,
      );
      y = Math.max(doc.y, y + 14) + 2;
      doc.moveTo(36, y).lineTo(36 + W, y).strokeColor("#e2e8f0").stroke();
      y += 2;
    }

    // Totais
    y += 8;
    const totais: [string, number][] = [
      ["Valor dos produtos", n.valor_produtos],
      ["Valor dos serviços", n.valor_servicos],
      ["Base ICMS", n.base_icms],
      ["Valor ICMS", n.valor_icms],
      ["Base ISS", n.base_iss],
      ["Valor ISS", n.valor_iss],
      ["PIS/COFINS", n.valor_pis_cofins],
      ["Desconto incondicional", -n.desconto_incondicional],
      ["Desconto condicional", -n.desconto_condicional],
    ];
    doc.fontSize(9).fillColor("#0f172a");
    for (const [rotulo, valor] of totais) {
      doc.text(rotulo, 300, y, { width: 150 });
      doc.text(formatBRL(valor), 450, y, { width: W - 414, align: "right" });
      y += 13;
    }
    doc.rect(300, y + 2, W - 264, 20).fill(verde);
    doc.fillColor("#ffffff").fontSize(11).text("TOTAL DO DOCUMENTO", 306, y + 7);
    doc.text(formatBRL(n.total), 450, y + 7, { width: W - 420, align: "right" });
    y += 32;

    doc.fillColor("#0f172a").fontSize(9);
    const t = n.transporte ?? {};
    if (n.tipo !== "NFS-e") {
      doc.fillColor(verde).text("TRANSPORTE", 36, y);
      doc.fillColor("#0f172a").text(
        t.incluir_frete
          ? `Modalidade: 0 - Por conta do remetente · Transportador: ${t.nome ?? "—"} ${t.cpf_cnpj ? `(${formatCpfCnpj(t.cpf_cnpj)})` : ""} · Placa: ${t.placa ?? "—"} · Peso bruto: ${t.peso_bruto ?? "—"} · Peso líquido: ${t.peso_liquido ?? "—"}${t.info ? `\n${t.info}` : ""}`
          : "Modalidade: 9 - Sem frete",
        { width: W },
      );
      y = doc.y + 8;
    }
    if (n.observacoes) {
      doc.fillColor(verde).text("INFORMAÇÕES COMPLEMENTARES", 36, y);
      doc.fillColor("#0f172a").text(n.observacoes, { width: W });
      y = doc.y + 8;
    }
    if (n.status === "cancelada" && n.motivo_cancelamento) {
      doc.fillColor("#b91c1c").text(`Cancelada. Justificativa: ${n.motivo_cancelamento}`, 36, y, { width: W });
    }
    doc.fillColor("#64748b").fontSize(7).text(`Identificador interno: ${n.id} · Gerado pela FINC em ${dataBR(new Date())}`, 36, doc.page.height - 50, {
      width: W,
      align: "center",
    });
    doc.end();
  });
}

export function escapeXml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const m2 = (v: unknown) => (Number(v) || 0).toFixed(2);

function parteXml(tag: string, p: Parte, ind: string): string {
  const e = escapeXml;
  return `${ind}<${tag}>
${ind}  <nome>${e(p.nome)}</nome>
${ind}  <cpfCnpj>${e(p.cpf_cnpj)}</cpfCnpj>
${ind}  <inscricaoEstadual>${e(p.inscricao_estadual)}</inscricaoEstadual>
${ind}  <inscricaoMunicipal>${e(p.inscricao_municipal)}</inscricaoMunicipal>
${ind}  <telefone>${e(p.telefone)}</telefone>
${ind}  <email>${e(p.email)}</email>
${ind}  <endereco>
${ind}    <cep>${e(p.cep)}</cep>
${ind}    <uf>${e(p.uf)}</uf>
${ind}    <cidade>${e(p.cidade)}</cidade>
${ind}    <logradouro>${e(p.logradouro)}</logradouro>
${ind}    <bairro>${e(p.bairro)}</bairro>
${ind}    <numero>${e(p.numero)}</numero>
${ind}    <complemento>${e(p.complemento)}</complemento>
${ind}  </endereco>
${ind}</${tag}>`;
}

/** XML no layout próprio da FINC (mesma estrutura <notaFiscal> do projeto original, ampliada). */
export function gerarXml(n: NotaCompleta): string {
  const e = escapeXml;
  const t = n.transporte ?? {};
  const itens = n.itens
    .map(
      (i) => `    <item n="${i.ordem}">
      <tipo>${e(i.tipo)}</tipo>
      <codigo>${e(i.codigo)}</codigo>
      <descricao>${e(i.descricao)}</descricao>
      <categoria>${e(i.categoria)}</categoria>
      <unidade>${e(i.unidade)}</unidade>
      <ncm>${e(i.ncm)}</ncm>
      <cfop>${e(i.cfop)}</cfop>
      <codigoServico>${e(i.codigo_servico)}</codigoServico>
      <qtd>${Number(i.quantidade)}</qtd>
      <valorUnit>${m2(i.valor_unitario)}</valorUnit>
      <subtotal>${m2(i.subtotal)}</subtotal>
      <obs>${e(i.info)}</obs>
      <icmsAliq>${i.icms ?? 0}</icmsAliq>
      <issAliq>${i.aliquota_iss ?? 0}</issAliq>
      <pisCofinsAliq>${i.pis_cofins ?? 0}</pisCofinsAliq>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<notaFiscal xmlns="urn:finc:documento:2.0">
  <meta>
    <id>${e(n.id)}</id>
    <tipo>${e(n.tipo)}</tipo>
    <serie>${String(n.serie).padStart(3, "0")}</serie>
    <numero>${e(numeroFormatado(n))}</numero>
    <status>${e(n.status)}</status>
    <ambiente>${e(n.ambiente)}</ambiente>
    <naturezaOperacao>${e(n.natureza_operacao)}</naturezaOperacao>
    <dataEmissao>${n.data_emissao ? new Date(n.data_emissao).toISOString() : ""}</dataEmissao>
    <aviso>${e(AVISO_SEM_VALOR)}</aviso>
  </meta>
${parteXml("emissor", n.emitente, "  ")}
${parteXml("destinatario", n.destinatario, "  ")}
  <transporte>
    <modalidadeFrete>${t.incluir_frete ? "0 - Por conta do remetente" : "9 - Sem frete"}</modalidadeFrete>
    <nomeTransportador>${e(t.nome)}</nomeTransportador>
    <cpfCnpj>${e(t.cpf_cnpj)}</cpfCnpj>
    <placa>${e(t.placa)}</placa>
    <pesoBruto>${e(t.peso_bruto)}</pesoBruto>
    <pesoLiquido>${e(t.peso_liquido)}</pesoLiquido>
    <informacoes>${e(t.info)}</informacoes>
  </transporte>
  <itens>
${itens}
  </itens>
  <totais>
    <valorProdutos>${m2(n.valor_produtos)}</valorProdutos>
    <valorServicos>${m2(n.valor_servicos)}</valorServicos>
    <baseICMS>${m2(n.base_icms)}</baseICMS>
    <valorICMS>${m2(n.valor_icms)}</valorICMS>
    <baseISS>${m2(n.base_iss)}</baseISS>
    <valorISS>${m2(n.valor_iss)}</valorISS>
    <valorPISCOFINS>${m2(n.valor_pis_cofins)}</valorPISCOFINS>
    <descontoIncond>${m2(n.desconto_incondicional)}</descontoIncond>
    <descontoCond>${m2(n.desconto_condicional)}</descontoCond>
    <totalNota>${m2(n.total)}</totalNota>
  </totais>
  <observacoesGerais>${e(n.observacoes)}</observacoesGerais>
  <cancelamento>${e(n.motivo_cancelamento)}</cancelamento>
  <software>FINC 2.0</software>
</notaFiscal>
`;
}
