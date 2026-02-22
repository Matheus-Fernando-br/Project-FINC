import React, { useEffect, useMemo, useRef, useState } from "react";
import icons from "../../components/Icons";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { apiFetch } from "../../utils/api.js";

const STORAGE_KEY = "emitirNotaData";

function onlyDigits(str = "") {
  return (str || "").toString().replace(/\D/g, "");
}

function formatDateYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function money(v) {
  const n = Number(v) || 0;
  return n.toFixed(2);
}

// ✅ normaliza alíquotas “zoada” (ex: 451020 => 45.1020%)
function normalizeAliquota(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (n > 1000) return n / 10000; // 451020 -> 45.102
  if (n > 100) return n / 100; // 1800 -> 18
  return n; // 18 -> 18
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Tela_2_emitir_nota() {
  const [data, setData] = useState(null);
  const [emissor, setEmissor] = useState(null);
  const previewRef = useRef();

  // carrega dados da etapa 1
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        setData(null);
      }
    }
  }, []);

  // ✅ carrega emissor (usuário logado)
  useEffect(() => {
    const loadEmissor = async () => {
      try {
        const r = await apiFetch("/api/profile/me", { method: "GET" });
        const prof = r?.profile ?? r;
        setEmissor(prof);
      } catch (e) {
        console.error("Erro ao carregar emissor:", e);
        setEmissor(null);
      }
    };
    loadEmissor();
  }, []);

  const calculo = useMemo(() => {
    const items = data?.produtosServicos || [];

    let baseICMS = 0,
      valorICMS = 0;
    let baseISS = 0,
      valorISS = 0;
    let valorProdutos = 0,
      valorServicos = 0;

    // (opcional) pis/cofins “junto” se existir
    let valorPISCOFINS = 0;

    items.forEach((item) => {
      const qtd = Number(item.quantidade) || 0;
      const v = Number(item.valor) || 0;
      const totalItem = qtd * v;

      if (item.tipo === "produto") {
        valorProdutos += totalItem;
        baseICMS += totalItem;

        const ali = normalizeAliquota(item.icms); // %
        valorICMS += totalItem * (ali / 100);

        const aliPisCof = normalizeAliquota(item.pis_cofins);
        valorPISCOFINS += totalItem * (aliPisCof / 100);
      }

      if (item.tipo === "servico") {
        valorServicos += totalItem;
        baseISS += totalItem;

        const ali = normalizeAliquota(item.aliquota_iss);
        valorISS += totalItem * (ali / 100);
      }
    });

    const descIncond = Number(data?.descIncond) || 0;
    const descCond = Number(data?.descCond) || 0;
    const descontos = descIncond + descCond;

    const totalNota =
      valorProdutos +
      valorServicos +
      valorICMS +
      valorISS +
      valorPISCOFINS -
      descontos;

    return {
      baseICMS,
      valorICMS,
      baseISS,
      valorISS,
      valorProdutos,
      valorServicos,
      valorPISCOFINS,
      descontos,
      descIncond,
      descCond,
      totalNota,
    };
  }, [data]);

  const gerarPdf = () => {
    if (!data) return alert("Nenhum dado salvo para gerar a nota.");

    const cpfRaw = onlyDigits(data.clienteCpfCnpj || "semcpf");
    const filename = `nota-fiscal-${cpfRaw || "semcpf"}-${formatDateYYYYMMDD(new Date())}.pdf`;

    const element = previewRef.current;
    const opt = {
      margin: 10,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const gerarXml = () => {
    if (!data) return;

    const now = new Date().toISOString();
    const serie = "001";
    const numero = "000000001";

    const emit = {
      nome: emissor?.social_name || "EMISSOR",
      cpfCnpj: emissor?.cpf_cnpj || "",
      ie: emissor?.inscricao || "",
      tel: emissor?.telefone || "",
      endereco: {
        cep: emissor?.cep || "",
        uf: emissor?.uf || "",
        cidade: emissor?.cidade || "",
        logradouro: emissor?.logradouro || "",
        bairro: emissor?.bairro || "",
        numero: emissor?.numero || "",
        complemento: emissor?.complemento || "",
      },
    };

    const dest = {
      nome: data?.clienteCompleto?.nome_social || "",
      cpfCnpj: data?.clienteCompleto?.cpf_cnpj || "",
      tel: data?.clienteCompleto?.telefone || "",
      email: data?.clienteCompleto?.email || "",
      endereco: {
        cep: data?.clienteCompleto?.cep || "",
        uf: data?.clienteCompleto?.uf || "",
        cidade: data?.clienteCompleto?.cidade || "",
        logradouro: data?.clienteCompleto?.logradouro || "",
        bairro: data?.clienteCompleto?.bairro || "",
        numero: data?.clienteCompleto?.numero || "",
        complemento: data?.clienteCompleto?.complemento || "",
      },
    };

    const itensXml = (data?.produtosServicos || [])
      .map((p, idx) => {
        const total = (Number(p.quantidade) || 0) * (Number(p.valor) || 0);
        return `
      <item n="${idx + 1}">
        <tipo>${p.tipo || ""}</tipo>
        <descricao>${(p.nome || "").replaceAll("&", "e")}</descricao>
        <categoria>${(p.categoriaItem || "").replaceAll("&", "e")}</categoria>
        <qtd>${Number(p.quantidade) || 0}</qtd>
        <valorUnit>${money(p.valor)}</valorUnit>
        <subtotal>${money(total)}</subtotal>
        <obs>${(p.info || "").replaceAll("&", "e")}</obs>
        <icmsAliq>${normalizeAliquota(p.icms)}</icmsAliq>
        <issAliq>${normalizeAliquota(p.aliquota_iss)}</issAliq>
        <pisCofinsAliq>${normalizeAliquota(p.pis_cofins)}</pisCofinsAliq>
      </item>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<notaFiscal>
  <meta>
    <tipo>${data?.tipoNota || ""}</tipo>
    <serie>${serie}</serie>
    <numero>${numero}</numero>
    <dataEmissao>${now}</dataEmissao>
  </meta>

  <emissor>
    <nome>${emit.nome}</nome>
    <cpfCnpj>${emit.cpfCnpj}</cpfCnpj>
    <inscricaoEstadual>${emit.ie}</inscricaoEstadual>
    <telefone>${emit.tel}</telefone>
    <endereco>
      <cep>${emit.endereco.cep}</cep>
      <uf>${emit.endereco.uf}</uf>
      <cidade>${emit.endereco.cidade}</cidade>
      <logradouro>${emit.endereco.logradouro}</logradouro>
      <bairro>${emit.endereco.bairro}</bairro>
      <numero>${emit.endereco.numero}</numero>
      <complemento>${emit.endereco.complemento}</complemento>
    </endereco>
  </emissor>

  <destinatario>
    <nome>${dest.nome}</nome>
    <cpfCnpj>${dest.cpfCnpj}</cpfCnpj>
    <telefone>${dest.tel}</telefone>
    <email>${dest.email}</email>
    <endereco>
      <cep>${dest.endereco.cep}</cep>
      <uf>${dest.endereco.uf}</uf>
      <cidade>${dest.endereco.cidade}</cidade>
      <logradouro>${dest.endereco.logradouro}</logradouro>
      <bairro>${dest.endereco.bairro}</bairro>
      <numero>${dest.endereco.numero}</numero>
      <complemento>${dest.endereco.complemento}</complemento>
    </endereco>
  </destinatario>

  <itens>${itensXml}
  </itens>

  <totais>
    <valorProdutos>${money(calculo.valorProdutos)}</valorProdutos>
    <valorServicos>${money(calculo.valorServicos)}</valorServicos>
    <baseICMS>${money(calculo.baseICMS)}</baseICMS>
    <valorICMS>${money(calculo.valorICMS)}</valorICMS>
    <baseISS>${money(calculo.baseISS)}</baseISS>
    <valorISS>${money(calculo.valorISS)}</valorISS>
    <valorPISCOFINS>${money(calculo.valorPISCOFINS)}</valorPISCOFINS>
    <descontoIncond>${money(calculo.descIncond)}</descontoIncond>
    <descontoCond>${money(calculo.descCond)}</descontoCond>
    <totalNota>${money(calculo.totalNota)}</totalNota>
  </totais>

  <observacoesGerais>${(data?.obsGeral || "").replaceAll("&", "e")}</observacoesGerais>
  <software>FINC</software>
</notaFiscal>`;

    const cpfRaw = onlyDigits(data?.clienteCpfCnpj || "semcpf");
    const filename = `nota-fiscal-${cpfRaw || "semcpf"}-${formatDateYYYYMMDD(new Date())}.xml`;
    downloadBlob(filename, xml, "application/xml;charset=utf-8");
  };

  if (!data) {
    return (
      <main className="content">
        <section className="titulo-secao">
          <h1>
            <i className={icons.emitirNota}></i> Emitir Nota Fiscal
          </h1>
        </section>
        <section className="form-section">
          <div className="section-header">
            <span className="icon">
              <i className={icons.relatorio}></i>
            </span>
            <h3>Consulta da nota</h3>
          </div>
          <hr className="divider" />
          <div className="form-row">
            <p>
              Nenhum dado encontrado. Volte à etapa anterior e preencha os
              campos.
            </p>
          </div>
        </section>
        <div className="form-footer-voltar">
          <Link
            to="/emitir-nota/Dados"
            className="previous-step"
            onClick={() => localStorage.setItem("emitirNotaVoltar", "1")}
          >
            Voltar <i className="bi bi-chevron-double-left"></i>
            <i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>
      </main>
    );
  }

  const transporte = {
    modalidade_frete:
      data?.incluirFrete === "sim"
        ? "0 - Por conta do remetente"
        : "9 - Sem frete",
    nome_transportador: data?.transNome || "",
    cpf_cnpj: data?.transCpf || "",
    placa: data?.placa || "",
    peso_bruto: data?.pesoBruto || "",
    peso_liquido: data?.pesoLiquido || "",
    info: data?.infoTransporte || "",
  };

  const somaProdutos = (data.produtosServicos || []).reduce((acc, p) => {
    const q = Number(p.quantidade) || 0;
    const v = Number(p.valor) || 0;
    return acc + q * v;
  }, 0);

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.emitirNota}></i> Emitir Nota Fiscal
        </h1>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorio}></i>
          </span>
          <h3>Consulta da nota</h3>
        </div>
        <hr className="divider" />

        <div
          ref={previewRef}
          style={{
            background: "#fff",
            color: "#000",
            fontSize: 11,
            fontFamily: "Arial, Helvetica, sans-serif",
            padding: 12,
          }}
        >
          {/* CABEÇALHO (✅ agora emissor = usuário) */}
          <div
            style={{
              display: "flex",
              border: "1px solid #000",
              marginBottom: 6,
            }}
          >
            <div style={{ width: "35%", padding: 6 }}>
              <img
                src="/Images/FINC.png"
                alt="FINC"
                style={{
                  maxWidth: 120,
                  marginBottom: 4,
                  background: "#131212b7",
                  borderRadius: 8,
                }}
              />
              <div style={{ fontSize: 10 }}>
                <h1>{emissor?.social_name || "EMISSOR (carregando...)"}</h1>
                <br />
                CPF/CNPJ: {emissor?.cpf_cnpj || "-"}
                <br />
                IE: {emissor?.inscricao || "-"}
                <br />
                Endereço: {emissor?.logradouro || "-"}, {emissor?.numero || "-"}{" "}
                {emissor?.bairro ? `- ${emissor?.bairro}` : ""}
                <br />
                CEP: {emissor?.cep || "-"} - {emissor?.cidade || "-"} /{" "}
                {emissor?.uf || "-"}
                <br />
                Tel: {emissor?.telefone || "-"}
                <br />
                <span style={{ fontSize: 9, opacity: 0.8 }}>
                  Emitido via FINC
                </span>
              </div>
            </div>

            <div
              style={{
                width: "25%",
                textAlign: "center",
                borderLeft: "1px solid #000",
                borderRight: "1px solid #000",
                paddingTop: 6,
              }}
            >
              <h1>DANFE</h1>
              <br />
              <p>
                Documento Auxiliar da Nota Fiscal Eletrônica
                <br />
              </p>
              <br />
              <strong>0 - Entrada</strong>
              <br />
              <strong>1 - Saída</strong>
              <h2
                style={{
                  border: "1px solid #000",
                  margin: "15px",
                  marginLeft: "80px",
                  marginRight: "80px",
                }}
              >
                1
              </h2>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  borderTop: "1px solid #000",
                  paddingTop: 4,
                }}
              >
                Nº: 000000001
                <br />
                Série: 001
                <br />
              </div>
            </div>

            <div
              style={{
                width: "40%",
                fontSize: 9,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <h1 style={{ textAlign: "center", marginTop: 10 }}>
                {data.tipoNota}
              </h1>
              <br />

              <div
                style={{
                  padding: "6px 10px",
                  borderTop: "1px solid #000",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    height: 40,
                    width: "100%",
                    background:
                      "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)",
                  }}
                />
                <div style={{ fontSize: 8, marginTop: 2 }}>
                  Código de Barras
                </div>
              </div>

              <div
                style={{
                  marginTop: 6,
                  borderTop: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: 4,
                }}
              >
                <p>Chave de Acesso</p>
                <br />
                <span style={{ fontSize: 11, fontWeight: "bold" }}>
                  3525 0123 4567 8901 2345 5001 0000 0001 0000 0001
                </span>
              </div>

              <div
                style={{
                  fontSize: 8,
                  marginTop: 1,
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                Consulta de autenticidade no portal nacional da NF-e
                <br />
                www.nfe.fazenda.gov.br/portal ou no site da SEFAZ autorizada
              </div>
            </div>
          </div>

          {/* DADOS DO EMISSOR (linha ICMS etc) */}
          <div style={{ border: "1px solid #000", marginTop: -7 }}>
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #000",
                padding: "0px 4px",
              }}
            >
              <div style={{ width: "65%", paddingTop: 3 }}>
                <p style={{ fontSize: 8, marginBottom: 5 }}>
                  NATUREZA DA OPERAÇÃO
                </p>
                <p style={{ fontSize: 12, marginLeft: 2 }}>
                  Venda de produtos e serviços
                </p>
              </div>
              <div
                style={{
                  width: "35%",
                  borderLeft: "1px solid #000",
                  paddingLeft: 8,
                  paddingTop: 3,
                }}
              >
                <p style={{ fontSize: 8, marginBottom: 5 }}>
                  PROTOCOLO DE AUTORIZAÇÃO DE USO
                </p>
                <p style={{ fontSize: 12, marginLeft: 2 }}>
                  {data.tipoNota} sem Autorização de Uso da SEFAZ
                </p>
              </div>
            </div>

            <div style={{ display: "flex", padding: "0px 4px" }}>
              <div style={{ width: "40%", paddingTop: 3 }}>
                <p style={{ fontSize: 8, marginBottom: 5 }}>
                  INSCRIÇÃO ESTADUAL
                </p>
                <p style={{ fontSize: 12, marginLeft: 2 }}>
                  {emissor?.inscricao || "-"}
                </p>
              </div>
              <div
                style={{
                  width: "40%",
                  borderLeft: "1px solid #000",
                  paddingLeft: 8,
                  paddingTop: 3,
                }}
              >
                <p style={{ fontSize: 8, marginBottom: 5 }}>
                  INSCRIÇÃO ESTADUAL DO SUBSTITUTO TRIBUTÁRIO
                </p>
                <p style={{ fontSize: 12, marginLeft: 2 }}>-</p>
              </div>
              <div
                style={{
                  width: "20%",
                  borderLeft: "1px solid #000",
                  paddingLeft: 8,
                  paddingTop: 3,
                }}
              >
                <p style={{ fontSize: 8, marginBottom: 5 }}>CNPJ/CPF</p>
                <p style={{ fontSize: 12, marginLeft: 2 }}>
                  {emissor?.cpf_cnpj || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* DESTINATÁRIO / REMETENTE */}
          <div style={{ padding: "6px 0", fontSize: 9 }}>
            <strong>DESTINATÁRIO / REMETENTE</strong>

            <div style={{ border: "1px solid #000", marginTop: 4 }}>
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #000",
                  padding: "0px 4px",
                }}
              >
                <div style={{ width: "60%", paddingTop: 3 }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    NOME / RAZÃO SOCIAL
                  </p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.nome_social}
                  </p>
                </div>
                <div
                  style={{
                    width: "40%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>CPF/CNPJ</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.cpf_cnpj}
                  </p>
                </div>
                <div
                  style={{
                    width: "20%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    DATA DA EMISSÃO
                  </p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #000",
                  padding: "0px 4px",
                }}
              >
                <div style={{ width: "58%", paddingTop: 3 }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>ENDEREÇO</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.logradouro},{" "}
                    {data.clienteCompleto?.numero},{" "}
                    {data.clienteCompleto?.complemento || ""}
                  </p>
                </div>
                <div
                  style={{
                    width: "30%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    BAIRRO/DISTRITO
                  </p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.bairro}
                  </p>
                </div>
                <div
                  style={{
                    width: "12%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>CEP</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.cep}
                  </p>
                </div>
                <div
                  style={{
                    width: "20%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>DATA DA SAÍDA</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", padding: "0px 4px" }}>
                <div style={{ width: "38%", paddingTop: 3 }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>MUNICÍPIO</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.cidade}
                  </p>
                </div>
                <div
                  style={{
                    width: "5%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>UF</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.uf}
                  </p>
                </div>
                <div
                  style={{
                    width: "17%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>TELEFONE</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.telefone}
                  </p>
                </div>
                <div
                  style={{
                    width: "40%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>E-MAIL</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {data.clienteCompleto?.email}
                  </p>
                </div>
                <div
                  style={{
                    width: "20%",
                    borderLeft: "1px solid #000",
                    paddingLeft: 8,
                    paddingTop: 3,
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>HORA DA SAÍDA</p>
                  <p style={{ fontSize: 12, marginLeft: 2 }}>
                    {new Date().toLocaleTimeString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CÁLCULO DO IMPOSTO (✅ agora inclui PIS/COFINS e descontos separados) */}
          <div style={{ padding: "6px 0", fontSize: 9 }}>
            <strong>CÁLCULO DO IMPOSTO</strong>
            <div style={{ border: "1px solid #000", marginTop: 4 }}>
              <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
                <div style={{ width: "25%", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    BASE DE CÁLCULO DO ICMS
                  </p>
                  <p style={{ fontSize: 12 }}>R$ {money(calculo.baseICMS)}</p>
                </div>
                <div
                  style={{
                    width: "15%",
                    borderLeft: "1px solid #000",
                    padding: "3px 4px",
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR DO ICMS</p>
                  <p style={{ fontSize: 12 }}>R$ {money(calculo.valorICMS)}</p>
                </div>
                <div
                  style={{
                    width: "25%",
                    borderLeft: "1px solid #000",
                    padding: "3px 4px",
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    BASE DE CÁLCULO DO ISS
                  </p>
                  <p style={{ fontSize: 12 }}>R$ {money(calculo.baseISS)}</p>
                </div>
                <div
                  style={{
                    width: "35%",
                    borderLeft: "1px solid #000",
                    padding: "3px 4px",
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR DO ISS</p>
                  <p style={{ fontSize: 12 }}>R$ {money(calculo.valorISS)}</p>
                </div>
              </div>

              <div style={{ display: "flex" }}>
                <div style={{ width: "25%", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    VALOR PIS/COFINS
                  </p>
                  <p style={{ fontSize: 12 }}>
                    R$ {money(calculo.valorPISCOFINS)}
                  </p>
                </div>

                <div
                  style={{
                    width: "25%",
                    borderLeft: "1px solid #000",
                    padding: "3px 4px",
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    DESCONTO INCOND.
                  </p>
                  <p style={{ fontSize: 12 }}>R$ {money(calculo.descIncond)}</p>
                </div>

                <div
                  style={{
                    width: "25%",
                    borderLeft: "1px solid #000",
                    padding: "3px 4px",
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>DESCONTO COND.</p>
                  <p style={{ fontSize: 12 }}>R$ {money(calculo.descCond)}</p>
                </div>

                <div
                  style={{
                    width: "25%",
                    borderLeft: "1px solid #000",
                    padding: "3px 4px",
                  }}
                >
                  <p style={{ fontSize: 8, marginBottom: 5 }}>
                    VALOR TOTAL DA NOTA
                  </p>
                  <p style={{ fontSize: 12, fontWeight: "bold" }}>
                    R$ {money(calculo.totalNota)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA ITENS (✅ inclui OBS) */}
          <div style={{ padding: "6px 0", fontSize: 9 }}>
            <strong>DADOS DOS PRODUTOS/SERVIÇOS</strong>
            <div style={{ marginTop: 4 }}>
              <table
                width="100%"
                style={{ borderCollapse: "collapse", marginTop: 6 }}
              >
                <thead>
                  <tr>
                    {[
                      "Descrição",
                      "Categoria",
                      "Qtd",
                      "Vlr Unit",
                      "Subtotal",
                      "Obs",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          border: "1px solid #000",
                          padding: 4,
                          textAlign: "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.produtosServicos || []).map((p, i) => {
                    const subtotal =
                      (Number(p.quantidade) || 0) * (Number(p.valor) || 0);
                    return (
                      <tr key={i}>
                        <td style={{ border: "1px solid #000", padding: 4 }}>
                          {p.nome}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 4 }}>
                          {p.categoriaItem}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: 4,
                            textAlign: "right",
                          }}
                        >
                          {p.quantidade}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: 4,
                            textAlign: "right",
                          }}
                        >
                          R$ {money(p.valor)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: 4,
                            textAlign: "right",
                          }}
                        >
                          R$ {money(subtotal)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 4 }}>
                          {p.info || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <div style={{ width: 280 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Subtotal</span>
                    <span>R$ {money(somaProdutos)}</span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Desc. Incond.</span>
                    <span>R$ {money(calculo.descIncond)}</span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Desc. Cond.</span>
                    <span>R$ {money(calculo.descCond)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "bold",
                      borderTop: "1px solid #000",
                      marginTop: 4,
                      paddingTop: 4,
                    }}
                  >
                    <span>Valor Total Nota</span>
                    <span>R$ {money(calculo.totalNota)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DADOS ADICIONAIS (✅ agora mostra observação geral) */}
          <div style={{ padding: "6px 0", fontSize: 9 }}>
            <strong>DADOS ADICIONAIS</strong>
            <div style={{ border: "1px solid #000", marginTop: 4 }}>
              <div style={{ padding: "6px 8px" }}>
                <p style={{ fontSize: 8, marginBottom: 6 }}>
                  INFORMAÇÕES COMPLEMENTARES
                </p>
                <p style={{ fontSize: 12 }}>{data?.obsGeral || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTÕES */}
      <section className="emitir">
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorioAdd}></i>
          </span>
          <h3>Emitir nota</h3>
        </div>
        <hr className="divider" />
        <div className="botao_geral" style={{ gap: 10 }}>
          <button className="btn" onClick={gerarPdf}>
            Baixar PDF
          </button>
          <button className="btn" onClick={gerarXml}>
            Baixar XML
          </button>
        </div>
      </section>

      <div className="form-footer-voltar">
        <Link
          to="/emitir-nota/Dados"
          className="previous-step"
          onClick={() => localStorage.setItem("emitirNotaVoltar", "1")}
        >
          Voltar <i className="bi bi-chevron-double-left"></i>
          <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>
    </main>
  );
}

export default Tela_2_emitir_nota;
