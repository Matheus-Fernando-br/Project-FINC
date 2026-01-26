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

  useEffect(() => {
    if (!data?.produtosServicos) return;

    let baseICMS = 0;
    let valorICMS = 0;
    let baseISS = 0;
    let valorISS = 0;
    let valorProdutos = 0;
    let valorServicos = 0;

    data.produtosServicos.forEach(item => {
      const qtd = Number(item.quantidade) || 0;
      const valor = Number(item.valor) || 0;
      const totalItem = qtd * valor;

      if (item.tipo === "produto") {
        valorProdutos += totalItem;
        baseICMS += totalItem;
        valorICMS += totalItem * (Number(item.icms) / 100);
      }

      if (item.tipo === "servico") {
        valorServicos += totalItem;
        baseISS += totalItem;
        valorISS += totalItem * (Number(item.aliquota_iss) / 100);
      }
    });

    const descontos =
      (Number(data.descIncond) || 0) +
      (Number(data.descCond) || 0);

    const totalNota =
      valorProdutos +
      valorServicos +
      valorICMS +
      valorISS -
      descontos;

    setCalculoImpostos({
      baseICMS: baseICMS.toFixed(2),
      valorICMS: valorICMS.toFixed(2),
      baseISS: baseISS.toFixed(2),
      valorISS: valorISS.toFixed(2),
      valorProdutos: valorProdutos.toFixed(2),
      valorServicos: valorServicos.toFixed(2),
      valorIPI: "0.00",
      totalNota: totalNota.toFixed(2)
    });

  }, [data]);

  const [calculoImpostos, setCalculoImpostos] = useState({
    baseICMS: "0.00",
    valorICMS: "0.00",
    baseISS: "0.00",
    valorISS: "0.00",
    valorProdutos: "0.00",
    valorServicos: "0.00",
    valorIPI: "0.00",
    totalNota: "0.00"
  });



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
    info: data?.infoTransporte || ""
  };


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

          {/* CABEÇALHO */}
          <div style={{ display: "flex", border: "1px solid #000", marginBottom: 6 }}>
            <div style={{ width: "35%", padding: 6 }}>
              <img
                src="/Images/FINC.png"
                alt="FINC"
                style={{ maxWidth: 120, marginBottom: 4, background: "#131212b7", borderRadius: 8 }}
              />
              <div style={{ fontSize: 10 }}>
                <h1>FINC PLATAFORMA DE EMISSÃO DE NOTAS FISCAIS AUTOMATIZADA LTDA</h1><br />
                CNPJ: 03.480.621/0001-15<br />
                Endereço: Rua Dezenove de Novembro, 121<br />
                Bairro: Centro - CEP: 35180-008<br />
                Timóteo – MG <br />
                Tel: (31) 3846-7000<br />
                Email: finc@gmail.com
              </div>
            </div>

            <div style={{
              width: "30%",
              textAlign: "center",
              borderLeft: "1px solid #000",
              borderRight: "1px solid #000",
              paddingTop: 6
            }}>
              <h1>DANFE</h1><br />
              <p>Documento Auxiliar da Nota Fiscal Eletrônica<br /></p><br />
     
              <strong>0 - Entrada</strong><br />
              <strong>1 - Saída</strong>
              <h2 style={{border: "2px solid #000", margin: "15px", 
                marginLeft: "110px", marginRight: "110px"}}>1</h2>

              <div style={{textAlign: "center", fontWeight: "bold", borderTop: "1px solid #000", paddingTop: 4}}>
                
                Nº: 000000001<br />
                Série: 001<br />
              </div>
            </div>

            <div
              style={{
                width: "35%",
                fontSize: 9,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >

              <h1 style={{textAlign: "center", marginTop: 10}}>{data.tipoNota}</h1><br />

              {/* CÓDIGO DE BARRAS FICTÍCIO */}
              <div
                style={{
                  padding: "6px 10px",
                  borderTop: "1px solid #000",
                  textAlign: "center"
                }}
              >
                <div
                  style={{
                    height: 40,
                    width: "100%",
                    background:
                      "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)"
                  }}
                />
                <div style={{ fontSize: 8, marginTop: 2 }}>
                  Código de Barras
                </div>
              </div>

              {/* CHAVE DE ACESSO */}
              <div style={{ marginTop: 6, borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: 4 }}>
                <p>Chave de Acesso</p><br />
                <span style={{ fontSize: 11, fontWeight: "bold" }}>
                  3525 0123 4567 8901 2345 5001 0000 0001 0000 0001
                </span>
              </div>

              {/* CONSULTA */}
              <div style={{ fontSize: 8, marginTop: 4, textAlign: "center" }}>
                Consulta de autenticidade no portal nacional da NF-e<br />
                www.nfe.fazenda.gov.br/portal ou no site da SEFAZ autorizada
              </div>
            </div>

          </div>

          {/* DESTINATÁRIO / REMETENTE */}
          <div style={{padding: "6px 0", fontSize: 9 }}>
            <strong>DESTINATÁRIO / REMETENTE</strong>
            
            <div style={{ border: "1px solid #000", marginTop: 4 }}>
            {/* LINHA 1 */}
            <div style={{ display: "flex", borderBottom: "1px solid #000", padding: "0px 4px" }}>
              <div style={{ width: "60%", paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>NOME / RAZÃO SOCIAL</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.nome_social}</p>
              </div>
              <div style={{ width: "40%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>CPF/CNPJ</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.cpf_cnpj}</p>
              </div>
              <div style={{ width: "20%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>DATA DA EMISSÃO</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{new Date().toLocaleString()}</p>
              </div>
            </div>
            {/* LINHA 2 */}
            <div style={{ display: "flex", borderBottom: "1px solid #000", padding: "0px 4px" }}>
              <div style={{ width: "58%", paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>ENDEREÇO</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.logradouro}, {data.clienteCompleto?.numero}, COMPLEMENTO {data.clienteCompleto?.complemento}</p>
              </div>
              <div style={{ width: "30%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>BAIRRO/DISTRITO</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.bairro}</p>
              </div>
              <div style={{ width: "12%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>CEP</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.cep}</p>
              </div>
              <div style={{ width: "20%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{ fontSize: 8, marginBottom: 5 }}>DATA DA SAÍDA</p>
                <p style={{ fontSize: 12, marginLeft: 2 }}>{new Date().toLocaleDateString("pt-BR")}</p>
              </div>
            </div>

            {/* LINHA 3 */}
            <div style={{ display: "flex", padding: "0px 4px" }}>
              <div style={{ width: "38%", paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>MUNICÍPIO</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.cidade}</p>
              </div>
              <div style={{ width: "5%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>UF</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.uf}</p>
              </div>
              <div style={{ width: "17%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>TELEFONE</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.telefone}</p>
              </div>
              <div style={{ width: "40%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>E-MAIL</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{data.clienteCompleto?.email}</p>
              </div>
              <div style={{ width: "20%", borderLeft: "1px solid #000", paddingLeft: 8, paddingTop: 3 }}>
                <p style={{fontSize: 8, marginBottom: 5}}>HORA DA SAÍDA</p>
                <p style={{fontSize: 12, marginLeft: 2}}>{new Date().toLocaleTimeString("pt-BR")}</p>
              </div>
            </div>    
            </div>
          </div>
          
          {/* IMPOSTO */}
          <div style={{ padding: "6px 0", fontSize: 9 }}>
            <strong>CÁLCULO DO IMPOSTO</strong>

            <div style={{ border: "1px solid #000", marginTop: 4 }}>

              {/* LINHA 1 */}
              <div style={{ display: "flex", borderBottom: "1px solid #000" }}>

                <div style={{ width: "25%", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>BASE DE CÁLCULO DO ICMS</p>
                  <p style={{ fontSize: 12 }}>R$ {calculoImpostos.baseICMS}</p>
                </div>

                <div style={{ width: "15%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR DO ICMS</p>
                  <p style={{ fontSize: 12 }}>R$ {calculoImpostos.valorICMS}</p>
                </div>

                <div style={{ width: "25%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>BASE DE CÁLCULO DO ICMS SUBST.</p>
                  <p style={{ fontSize: 12 }}>R$ 0,00</p>
                </div>

                <div style={{ width: "35%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR TOTAL DOS PRODUTOS</p>
                  <p style={{ fontSize: 12 }}>R$ {calculoImpostos.valorProdutos}</p>
                </div>

              </div>

              {/* LINHA 2 */}
              <div style={{ display: "flex" }}>

                <div style={{ width: "20%", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR DO FRETE</p>
                  <p style={{ fontSize: 12 }}>R$ 0,00</p>
                </div>

                <div style={{ width: "20%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR DO SEGURO</p>
                  <p style={{ fontSize: 12 }}>R$ 0,00</p>
                </div>

                <div style={{ width: "15%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>DESCONTO</p>
                  <p style={{ fontSize: 12 }}>R$ 0,00</p>
                </div>

                <div style={{ width: "20%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>OUTRAS DESPESAS</p>
                  <p style={{ fontSize: 12 }}>R$ 0,00</p>
                </div>

                <div style={{ width: "10%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR DO IPI</p>
                  <p style={{ fontSize: 12 }}>R$ {calculoImpostos.valorIPI}</p>
                </div>

                <div style={{ width: "15%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>VALOR TOTAL DA NOTA</p>
                  <p style={{ fontSize: 12, fontWeight: "bold" }}>
                    R$ {calculoImpostos.totalNota}
                  </p>
                </div>

              </div>

            </div>
          </div>

          <div style={{ padding: "6px 0", fontSize: 9 }}>
            <strong>TRANSPORTADOR / VOLUMES TRANSPORTADOS</strong>

            <div style={{ border: "1px solid #000", marginTop: 4 }}>

              {/* LINHA 1 */}
              <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
                <div style={{ width: "30%", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>MODALIDADE DO FRETE</p>
                  <p style={{ fontSize: 12 }}>
                    {transporte.modalidade_frete}
                  </p>
                </div>

                <div style={{ width: "40%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>TRANSPORTADOR</p>
                  <p style={{ fontSize: 12 }}>
                    {transporte.nome_transportador}
                  </p>
                </div>

                <div style={{ width: "30%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>CNPJ / CPF</p>
                  <p style={{ fontSize: 12 }}>
                    {transporte.cpf_cnpj}
                  </p>
                </div>
              </div>

              {/* LINHA 2 */}
              <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
                <div style={{ width: "50%", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>PLACA DO VEÍCULO</p>
                  <p style={{ fontSize: 12 }}>
                    {transporte.placa}
                  </p>
                </div>

                <div style={{ width: "25%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>PESO BRUTO</p>
                  <p style={{ fontSize: 12 }}>
                    {transporte.peso_bruto} Kg
                  </p>
                </div>

                <div style={{ width: "25%", borderLeft: "1px solid #000", padding: "3px 4px" }}>
                  <p style={{ fontSize: 8, marginBottom: 5 }}>PESO LÍQUIDO</p>
                  <p style={{ fontSize: 12 }}>
                    {transporte.peso_liquido} Kg
                  </p>
                </div>
              </div>

              {/* LINHA 3 */}
              <div style={{ padding: "3px 4px" }}>
                <p style={{ fontSize: 8, marginBottom: 5 }}>INFORMAÇÕES ADICIONAIS</p>
                <p style={{ fontSize: 12 }}>
                  {transporte.info}
                </p>
              </div>

            </div>
          </div>



          {/* PRODUTOS */}
          <table width="100%" style={{ borderCollapse: "collapse", marginTop: 6 }}>
            <thead>
              <tr>
                {["Descrição", "Categoria", "Qtd", "Vlr Unit", "Subtotal"].map(h => (
                  <th key={h} style={{
                    border: "1px solid #000",
                    padding: 4,
                    textAlign: "left"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.produtosServicos.map((p, i) => {
                const subtotal = (p.quantidade * p.valor).toFixed(2);
                return (
                  <tr key={i}>
                    <td style={{ border: "1px solid #000", padding: 4 }}>{p.nome}</td>
                    <td style={{ border: "1px solid #000", padding: 4 }}>{p.categoriaItem}</td>
                    <td style={{ border: "1px solid #000", padding: 4, textAlign: "right" }}>{p.quantidade}</td>
                    <td style={{ border: "1px solid #000", padding: 4, textAlign: "right" }}>R$ {p.valor.toFixed(2)}</td>
                    <td style={{ border: "1px solid #000", padding: 4, textAlign: "right" }}>R$ {subtotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TOTAIS */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8
          }}>
            <div style={{ width: 250 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span>R$ {somaProdutos.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Descontos</span>
                <span>R$ {(Number(data.descIncond) + Number(data.descCond)).toFixed(2)}</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                borderTop: "1px solid #000",
                marginTop: 4,
                paddingTop: 4
              }}>
                <span>Valor Total</span>
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
