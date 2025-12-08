import React, { useState } from "react";
import "./emitir-nota.css";
import icons from "../../components/Icons";
import { useNavigate } from "react-router-dom";

const ANIM_MS = 320; // manter em sincronia com o CSS (--anim-dur)

function Tela_1_emitir_nota() {
  const navigate = useNavigate();

  const [incluirFrete, setIncluirFrete] = useState("nao");

  const [cliente, setCliente] = useState({
    nomeSocial: "",
    cpfCnpj: ""
  });

  const [produtosServicos, setProdutosServicos] = useState([
    { id: Date.now(), item: "", tipoNota: "", quantidade: "", valor: "", info: "", isOpen: true }
  ]);

  // Adicionar produto/serviço
  const addProdutoServico = () => {
    const id = Date.now() + Math.random();
    const newItem = { id, item: "", tipoNota: "", quantidade: "", valor: "", info: "", isOpen: false };
    setProdutosServicos(prev => [...prev, newItem]);
    setTimeout(() => {
      setProdutosServicos(prev =>
        prev.map(x => (x.id === id ? { ...x, isOpen: true } : x))
      );
    }, 20);
  };

  const removeProdutoServico = (id) => {
    setProdutosServicos(prev => prev.map(x => x.id === id ? { ...x, isOpen: false } : x));
    setTimeout(() => {
      setProdutosServicos(prev => prev.filter(x => x.id !== id));
    }, ANIM_MS + 20);
  };

  const handleChange = (id, field, value) => {
    setProdutosServicos(prev =>
      prev.map(x => (x.id === id ? { ...x, [field]: value } : x))
    );
  };

  const handleClienteChange = (field, value) => {
    setCliente(prev => ({ ...prev, [field]: value }));
  };

  const temNFCe = produtosServicos.some(p => p.tipoNota === "NFC-e");

  // Calcula valor total somando valores (se informados)
  const calcularValorTotal = () => {
    const soma = produtosServicos.reduce((acc, p) => {
      const v = parseFloat(String(p.valor || 0).replace(",", "."));
      const q = parseFloat(String(p.quantidade || 1).replace(",", "."));
      if (isNaN(v)) return acc;
      if (isNaN(q)) return acc + v;
      return acc + v * q;
    }, 0);
    return soma.toFixed(2);
  };

  // Ao avançar, salva tudo em localStorage e navega para pré-visualização
  const handleAvancar = (e) => {
    e.preventDefault();
    // validações mínimas (ex.: nome e cpf)
    if (!cliente.nomeSocial.trim()) {
      alert("Preencha o Nome Social");
      return;
    }
    if (!cliente.cpfCnpj.trim()) {
      alert("Preencha o CPF/CNPJ");
      return;
    }

    const payload = {
      cliente,
      produtosServicos,
      incluirFrete,
      valores: {
        descontoIncond: document.getElementById("desc-incond")?.value || "0",
        descontoCond: document.getElementById("desc-cond")?.value || "0",
        valorTotal: document.getElementById("valor-total")?.value || calcularValorTotal()
      },
      transporte: {
        transNome: document.getElementById("trans-nome")?.value || "",
        transCpf: document.getElementById("trans-cpf")?.value || "",
        placa: document.getElementById("placa")?.value || "",
        pesoBruto: document.getElementById("peso-bruto")?.value || "",
        pesoLiquido: document.getElementById("peso-liquido")?.value || "",
        infoTransporte: document.getElementById("info-transporte")?.value || ""
      },
      meta: {
        empresaNome: "FINC PLATAFORMA DE EMISSÃO DE NOTAS FISCAIS AUTOMATIZADA LTDA",
        empresaCNPJ: "12.345.678/0001-90", // pode alterar
        empresaEndereco: "R. Dezenove de Novembro, 121 - Centro, Timóteo - MG, 35180-008",
        empresaCidadeUF: "Timóteo - MG"
      },
      criadoEm: new Date().toISOString()
    };

    // Salva no localStorage (simples e front-only)
    localStorage.setItem("emitirNota_dados", JSON.stringify(payload));
    navigate("/emitir-nota/Finalizar");
  };

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1><i className={icons.emitirNota}></i> Emitir Nota Fiscal</h1>
      </section>

      {/* Cliente */}
      <section className="form-section">
        <p className="frase-campo-asterisco">
          Os campos que contêm um asterisco (<span className="campo-obrigatório">*</span>) são obrigatórios.
        </p>
        <div className="section-header">
          <span className="icon"><i className={icons.clientes}></i></span>
          <h3>Cliente</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nome-social">Nome Social <span className="campo-obrigatório">*</span></label>
            <input id="nome-social" type="text" placeholder="Selecione"
              value={cliente.nomeSocial}
              onChange={(e) => handleClienteChange("nomeSocial", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="cpf-cnpj">CPF/CNPJ <span className="campo-obrigatório">*</span></label>
            <input id="cpf-cnpj" type="text" placeholder="Selecione"
              value={cliente.cpfCnpj}
              onChange={(e) => handleClienteChange("cpfCnpj", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Produtos / Serviços */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.produtos}></i></span>
          <h3>Produto/Serviço</h3>
        </div>
        <hr className="divider" />

        {produtosServicos.map((p) => (
          <div key={p.id} className={`produto-servico-bloco ${p.isOpen ? "open" : ""}`}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor={`item-${p.id}`}>
                  Selecione o produto/serviço: <span className="campo-obrigatório">*</span>
                </label>
                <input
                  id={`item-${p.id}`}
                  type="text"
                  placeholder="Selecione"
                  value={p.item}
                  onChange={(e) => handleChange(p.id, "item", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Que tipo de nota deseja?: <span className="campo-obrigatório">*</span>
                </label>
                <select
                  value={p.tipoNota}
                  onChange={(e) => handleChange(p.id, "tipoNota", e.target.value)}
                >
                  <option value="" disabled>Selecione um tipo de Nota Fiscal</option>
                  <option value="NF-e">NF-e (Produto)</option>
                  <option value="NFC-e">NFC-e (Consumidor)</option>
                  <option value="NFS-e">NFS-e (Serviço)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={`quantidade-${p.id}`}>
                  Quantidade: <span className="campo-obrigatório">*</span>
                </label>
                <input
                  id={`quantidade-${p.id}`}
                  type="text"
                  placeholder="Digite a quantidade"
                  value={p.quantidade}
                  onChange={(e) => handleChange(p.id, "quantidade", e.target.value)}
                />
              </div>
              <div className="form-group input-prefix">
                <label htmlFor={`valor-${p.id}`}>Valor</label>
                <span className="prefix">R$</span>
                <input id={`valor-${p.id}`} type="number" placeholder="0,00"
                  value={p.valor}
                  onChange={(e) => handleChange(p.id, "valor", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label htmlFor={`info-${p.id}`}>Informação complementar</label>
                <input
                  id={`info-${p.id}`}
                  type="text"
                  placeholder="Observações (opcional)"
                  value={p.info}
                  onChange={(e) => handleChange(p.id, "info", e.target.value)}
                />
              </div>
            </div>

            {produtosServicos.length > 1 && (
              <button type="button" className="btn-remover" onClick={() => removeProdutoServico(p.id)}>
                Remover Produto/Serviço
              </button>
            )}
            <hr className="divider" />
          </div>
        ))}

        <button type="button" className="btn-adicionar" onClick={addProdutoServico}>
          + Adicionar Produto/Serviço
        </button>
      </section>

      {/* Transporte */}
      <section className={`transport-section ${temNFCe ? "open" : ""}`}>
        <div className="transport-inner">
          <section className="form-section">
            <div className="section-header">
              <span className="icon"><i className={icons.transporte}></i></span>
              <h3>Transporte</h3>
            </div>
            <hr className="divider" />

            <div className="form-row radio-group">
              <label className="label-radio">
                Incluir frete? <span className="campo-obrigatório">*</span>
              </label>
              <div className="radio-option">
                <input
                  type="radio"
                  id="sim"
                  name="frete"
                  value="sim"
                  checked={incluirFrete === "sim"}
                  onChange={(e) => setIncluirFrete(e.target.value)}
                />
                <label htmlFor="sim">Sim</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="nao"
                  name="frete"
                  value="nao"
                  checked={incluirFrete === "nao"}
                  onChange={(e) => setIncluirFrete(e.target.value)}
                />
                <label htmlFor="nao">Não</label>
              </div>
            </div>

            <div className={`transport-panel ${incluirFrete === "sim" ? "open" : ""}`}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="trans-nome">Nome Social</label>
                  <input id="trans-nome" type="text" placeholder="Nome da Empresa" />
                </div>
                <div className="form-group">
                  <label htmlFor="trans-cpf">CPF/CNPJ</label>
                  <input id="trans-cpf" type="text" placeholder="CPF ou CNPJ da Empresa" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="placa">Placa do veículo</label>
                  <input id="placa" type="text" placeholder="000-0000" />
                </div>
                <div className="form-group input-suffix">
                  <label htmlFor="peso-bruto">Peso Bruto</label>
                  <input id="peso-bruto" type="number" placeholder="0" />
                  <span className="suffix">Kg</span>
                </div>
                <div className="form-group input-suffix">
                  <label htmlFor="peso-liquido">Peso Líquido</label>
                  <input id="peso-liquido" type="number" placeholder="0" />
                  <span className="suffix">Kg</span>
                </div>
              </div>

              <div className="form-row full">
                <div className="form-group">
                  <label htmlFor="info-transporte">Informação complementar</label>
                  <input id="info-transporte" type="text" placeholder="Observações (opcional)" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Valores */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.moeda}></i></span>
          <h3>Valores</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="desc-incond">Desconto incondicionado</label>
            <span className="prefix">R$</span>
            <input id="desc-incond" type="number" placeholder="0,00" />
          </div>
          <div className="form-group input-prefix">
            <label htmlFor="desc-cond">Desconto condicionado</label>
            <span className="prefix">R$</span>
            <input id="desc-cond" type="number" placeholder="0,00" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="valor-total">Valor Total</label>
            <span className="prefix">R$</span>
            <input id="valor-total" type="number" placeholder="0,00" defaultValue={calcularValorTotal()} />
          </div>
        </div>
      </section>

      <div className="form-footer-avancar">
        <button onClick={handleAvancar} className="btn">
          AVANÇAR <i className="bi bi-chevron-double-right"></i><i className="bi bi-chevron-double-right"></i>
        </button>
      </div>
    </main>
  );
}

export default Tela_1_emitir_nota;
