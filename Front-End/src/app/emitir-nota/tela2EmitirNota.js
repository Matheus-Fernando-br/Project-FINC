// Front-End/src/app/emitir-nota/Tela_2_emitir_nota.jsx
import React, { useEffect, useRef, useState } from "react";
import icons from "../../components/Icons";
import { Link } from 'react-router-dom';
import html2pdf from "html2pdf.js";

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

function Tela_2_emitir_nota() {
  const [data, setData] = useState(null);
  const previewRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        setData(null);
      }
    }
  }, []);

  const gerarPdf = () => {
    if (!data) return alert("Nenhum dado salvo para gerar a nota.");

    const cpfRaw = onlyDigits(data.clienteCpfCnpj || "semcpf");
    const filename = `nota-fiscal-${cpfRaw || "semcpf"}-${formatDateYYYYMMDD(new Date())}.pdf`;

    // configurações do html2pdf
    const element = previewRef.current;
    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!data) {
    return (
      <main className="content">
        <section className='titulo-secao'>
          <h1><i className={icons.emitirNota}></i> Emitir Nota Fiscal</h1>
        </section>
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.relatorio}></i></span>
            <h3>Consulta da nota</h3>
          </div>
          <hr className="divider" />
          <div className="form-row">
            <p>Nenhum dado encontrado. Volte à etapa anterior e preencha os campos.</p>
          </div>
        </section>
        <div className="form-footer-voltar">
          <Link to="/emitir-nota/Dados" className="previous-step">
            Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>
      </main>
    );
  }

  // total calculado já está em data.valorTotal, mas recalc aqui por segurança
  const somaProdutos = (data.produtosServicos || []).reduce((acc, p) => {
    const q = Number(p.quantidade) || 0;
    const v = Number(p.valor) || 0;
    return acc + q * v;
  }, 0);
  const descontos = (Number(data.descIncond) || 0) + (Number(data.descCond) || 0);
  const total = (somaProdutos - descontos) >= 0 ? (somaProdutos - descontos).toFixed(2) : "0.00";

  return (
    <main className="content">

      <section className="titulo-secao">
        <h1><i className={icons.emitirNota}></i> Emitir Nota Fiscal</h1>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorio}></i></span>
          <h3>Consulta da nota</h3>
        </div>
        <hr className="divider" />

        {/* Preview area que será convertida para PDF */}
        <div ref={previewRef} style={{ padding: 16, background: "#fff", color: "#000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <strong>FINC PLATAFORMA DE EMISSÃO DE NOTAS FISCAIS AUTOMATIZADA LTDA</strong><br />
              CNPJ: 03.480.621/0001-15<br />
              Endereço: R. Dezenove de Novembro, 121 - Centro, Timóteo - MG, 35180-008
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>Tipo:</strong> {data.tipoNota || "-"}<br />
              <strong>Data:</strong> {new Date().toLocaleDateString()}<br />
            </div>
          </div>

          <hr />

          {/* Dados do cliente */}
          <div style={{marginBottom:12, marginTop:12}}>
            <strong>Destinatário:</strong>
            <div>Nome Social: {data.clienteNome}</div>
            <div>CPF/CNPJ: {data.clienteCpfCnpj}</div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #000", textAlign: "left" }}>Item</th>
                <th style={{ borderBottom: "1px solid #000", textAlign: "right" }}>Qtd</th>
                <th style={{ borderBottom: "1px solid #000", textAlign: "right" }}>Valor Unit.</th>
                <th style={{ borderBottom: "1px solid #000", textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(data.produtosServicos || []).map((p, i) => {
                const subtotal = ((Number(p.quantidade) || 0) * (Number(p.valor) || 0)).toFixed(2);
                return (
                  <React.Fragment key={p.id}>
                    <tr>
                      <td style={{ paddingTop: 8 }}>{p.item || `Item ${i + 1}`}</td>
                      <td style={{ paddingTop: 8, textAlign: "right" }}>{p.quantidade || 0}</td>
                      <td style={{ paddingTop: 8, textAlign: "right" }}>{(Number(p.valor) || 0).toFixed(2)}</td>
                      <td style={{ paddingTop: 8, textAlign: "right" }}>{subtotal}</td>
                    </tr>
                    {p.info && (
                      <tr>
                        <td colSpan="4" style={{ fontSize: 12, color: "#333", paddingBottom: 8 }}>
                          <em>Descrição:</em> {p.info}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <hr />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20 }}>
            <div style={{ width: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, marginTop: 5}}>
                <span>Subtotal:</span>
                <span>R$ {somaProdutos.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" , marginBottom: 5}}>
                <span>Desconto incondicionado:</span>
                <span>- R$ {(Number(data.descIncond) || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" , marginBottom: 5}}>
                <span>Desconto condicionado:</span>
                <span>- R$ {(Number(data.descCond) || 0).toFixed(2)}</span>
              </div>
              <hr />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" , marginBottom: 5, marginTop: 7}}>
                <span>Valor Total:</span>
                <span>R$ {total}</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="emitir">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorioAdd}></i></span>
          <h3>Emitir nota</h3>
        </div>
        <hr className="divider" />
        <div className="botao_geral">
          <button className="btn" onClick={gerarPdf}>Emitir Nota Fiscal</button>
        </div>
      </section>

      <div className="form-footer-voltar">
        <Link to="/emitir-nota/Dados" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>
    </main>
  );
}

export default Tela_2_emitir_nota;
