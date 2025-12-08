import React, { useEffect, useState, useRef } from "react";
import icons from "../../components/Icons";
import { Link, useNavigate } from 'react-router-dom';
import html2pdf from "html2pdf.js"; // se usar CDN, remova esta linha

function Tela_2_emitir_nota() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const previewRef = useRef();

  useEffect(() => {
    const raw = localStorage.getItem("emitirNota_dados");
    if (!raw) {
      // se não há dados, volta para etapa anterior
      navigate("/emitir-nota/Dados");
      return;
    }
    setDados(JSON.parse(raw));
  }, [navigate]);

  const formatCurrency = (v) => {
    const n = Number(String(v).replace(",", ".") || 0);
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const sanitizeCpf = (cpf) => (cpf || "").toString().replace(/\D/g, "") || "sem-cpf";

  const formatDateForFilename = (iso) => {
    const d = new Date(iso || Date.now());
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  const handleEmitirPdf = async () => {
    if (!dados) return;
    const cpfClean = sanitizeCpf(dados.cliente?.cpfCnpj);
    const dataStr = formatDateForFilename(new Date().toISOString());
    const filename = `nota-fiscal-${cpfClean}-${dataStr}.pdf`;

    const element = previewRef.current;
    if (!element) return;

    // opções html2pdf
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    // se usou CDN: window.html2pdf().set(opt).from(element).save();
    html2pdf().set(opt).from(element).save();
  };

  if (!dados) return null;

  // construindo o markup da nota (você pode ajustar classes/estilo no CSS)
  return (
    <main className="content">
      <section className='titulo-secao'>
        <h1><i className={icons.emitirNota}></i> Emitir Nota Fiscal</h1>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorio}></i></span>
          <h3>Pré-visualização</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div style={{width: "100%"}}>
            {/* Aqui está a área que será convertida em PDF */}
            <div id="invoice-preview" ref={previewRef} style={{background:"#fff", padding:"20px", color:"#000", width:"100%", boxSizing:"border-box"}}>
              {/* Cabeçalho da empresa */}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                <div>
                  <h2 style={{margin:0}}>{dados.meta.empresaNome}</h2>
                  <div>CNPJ: {dados.meta.empresaCNPJ}</div>
                  <div>{dados.meta.empresaEndereco}</div>
                  <div>{dados.meta.empresaCidadeUF}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <h3 style={{margin:0}}>NOTA FISCAL (SIMULADA)</h3>
                  <div>Data: {new Date(dados.criadoEm).toLocaleString()}</div>
                </div>
              </div>

              <hr />

              {/* Dados do cliente */}
              <div style={{marginBottom:12}}>
                <strong>Destinatário:</strong>
                <div>{dados.cliente.nomeSocial}</div>
                <div>CPF/CNPJ: {dados.cliente.cpfCnpj}</div>
              </div>

              {/* Tabela de itens */}
              <table style={{width:"100%", borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    <th style={{border: "1px solid #333", padding:6}}>Item</th>
                    <th style={{border: "1px solid #333", padding:6}}>Tipo</th>
                    <th style={{border: "1px solid #333", padding:6}}>Qtde</th>
                    <th style={{border: "1px solid #333", padding:6}}>Valor unit.</th>
                    <th style={{border: "1px solid #333", padding:6}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtosServicos.map((p, idx) => {
                    const v = Number(String(p.valor || 0).replace(",", ".")) || 0;
                    const q = Number(String(p.quantidade || 0).replace(",", ".")) || 0;
                    const total = (v * (q || 1));
                    return (
                      <tr key={p.id}>
                        <td style={{border: "1px solid #333", padding:6}}>{p.item || `Item ${idx+1}`}</td>
                        <td style={{border: "1px solid #333", padding:6}}>{p.tipoNota}</td>
                        <td style={{border: "1px solid #333", padding:6, textAlign:"center"}}>{p.quantidade || "1"}</td>
                        <td style={{border: "1px solid #333", padding:6, textAlign:"right"}}>R$ {formatCurrency(p.valor || 0)}</td>
                        <td style={{border: "1px solid #333", padding:6, textAlign:"right"}}>R$ {formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Valores finais */}
              <div style={{display:"flex", justifyContent:"flex-end", marginTop:12}}>
                <div style={{width:320}}>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span>Desconto incondicionado:</span><span>R$ {formatCurrency(dados.valores.descontoIncond)}</span></div>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span>Desconto condicionado:</span><span>R$ {formatCurrency(dados.valores.descontoCond)}</span></div>
                  <div style={{display:"flex", justifyContent:"space-between", fontWeight:"bold", marginTop:8}}><span>Valor Total:</span><span>R$ {formatCurrency(dados.valores.valorTotal)}</span></div>
                </div>
              </div>

              <hr style={{marginTop:16}} />

              {/* Informações de transporte (se houver) */}
              {dados.incluirFrete === "sim" && (
                <div style={{marginTop:8}}>
                  <strong>Transporte:</strong>
                  <div>{dados.transporte.transNome} - {dados.transporte.transCpf}</div>
                  <div>Placa: {dados.transporte.placa}</div>
                  <div>Peso bruto: {dados.transporte.pesoBruto} Kg</div>
                </div>
              )}

              <div style={{marginTop:20, fontSize:12}}>
                <em>Nota fiscal gerada apenas para simulação. Não tem validade fiscal.</em>
              </div>
            </div>
            {/* fim preview */}
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
          <button className="btn" onClick={handleEmitirPdf}>Emitir Nota Fiscal (Baixar PDF)</button>
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
