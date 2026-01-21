// Front-End/src/app/emitir-nota/Tela_1_emitir_nota.jsx
import React, { useEffect, useState } from "react";
import "./emitir-nota.css";
import icons from "../../components/Icons";
import { Link } from "react-router-dom";

const ANIM_MS = 320; // manter em sincronia com o CSS (--anim-dur)
const STORAGE_KEY = "emitirNotaData";

function maskCpfCnpj(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length > 11) {
    // CNPJ: 00.000.000/0000-00
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .slice(0, 18);
  } else {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }
}

function Tela_1_emitir_nota() {
  const [incluirFrete, setIncluirFrete] = useState("nao");

  const [produtosServicos, setProdutosServicos] = useState([
    { id: Date.now(), item: "", tipoNotaItem: "", quantidade: 1, valor: 0, info: "", isOpen: true }
  ]);

  // -------------------------------------------------
  // Tipo de nota (único, isolado acima dos produtos)
  const [tipoNota, setTipoNota] = useState("");

  // Cliente
  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState("");
  const [clienteCompleto, setClienteCompleto] = useState("null");

  //Listas do banco
  const [listaClientes, setListaClientes] = useState([]);
  const [listaItens, setListaItens] = useState([]);
  const [showDropdownCli, setShowDropdownCli] = useState(false);
  const [showDropdownItem, setShowDropdownItem] = useState({});

  // Transporte
  const [transNome, setTransNome] = useState("");
  const [transCpf, setTransCpf] = useState("");
  const [placa, setPlaca] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");
  const [pesoLiquido, setPesoLiquido] = useState("");
  const [infoTransporte, setInfoTransporte] = useState("");

  // Valores / descontos
  const [descIncond, setDescIncond] = useState(0);
  const [descCond, setDescCond] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);

  const token = localStorage.getItem("token")

  // load saved (optional)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj && obj.produtosServicos) {
          setProdutosServicos(obj.produtosServicos);
          setTipoNota(obj.tipoNota || "");
          setClienteNome(obj.clienteNome || "");
          setClienteCpfCnpj(obj.clienteCpfCnpj || "");
          setIncluirFrete(obj.incluirFrete || "nao");
          setTransNome(obj.transNome || "");
          setTransCpf(obj.transCpf || "");
          setPlaca(obj.placa || "");
          setPesoBruto(obj.pesoBruto || "");
          setPesoLiquido(obj.pesoLiquido || "");
          setInfoTransporte(obj.infoTransporte || "");
          setDescIncond(obj.descIncond || 0);
          setDescCond(obj.descCond || 0);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // calcular total sempre que produtos ou descontos mudarem
  useEffect(() => {
    const somaProdutos = produtosServicos.reduce((acc, p) => {
      const q = Number(p.quantidade) || 0;
      const v = Number(p.valor) || 0;
      return acc + q * v;
    }, 0);

    const descontos = (Number(descIncond) || 0) + (Number(descCond) || 0);
    const total = somaProdutos - descontos;
    setValorTotal(total >= 0 ? Number(total.toFixed(2)) : 0);
  }, [produtosServicos, descIncond, descCond]);

  // Produtos manipulação (mantendo sua lógica)
  const addProdutoServico = () => {
    const id = Date.now() + Math.random();
    const newItem = { id, item: "", tipoNotaItem: "", quantidade: 1, valor: 0, info: "", isOpen: false };
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

  // CPF/CNPJ mask handler
  const handleCpfCnpjChange = (e) => {
    const raw = e.target.value;
    const masked = maskCpfCnpj(raw);
    setClienteCpfCnpj(masked);
  };

  // salvar dados no localStorage e seguir para Tela2
  const salvarEAvancar = () => {
    const payload = {
      tipoNota,
      incluirFrete,
      produtosServicos,
      clienteNome,
      clienteCpfCnpj,
      transNome,
      transCpf,
      placa,
      pesoBruto,
      pesoLiquido,
      infoTransporte,
      descIncond,
      descCond,
      valorTotal
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // o Link vai navegar; mas salvamos antes
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
            <input id="nome-social" type="text" placeholder="Selecione" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="cpf-cnpj">CPF/CNPJ <span className="campo-obrigatório">*</span></label>
            <input
              id="cpf-cnpj"
              type="text"
              placeholder="Selecione"
              maxLength={18}
              value={clienteCpfCnpj}
              onChange={handleCpfCnpjChange}
            />
          </div>
        </div>
      </section>

      {/* Tipo de Nota (isolado e único) */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.produtos}></i></span>
          <h3>Tipo de Nota (aplica a todos os itens)</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label>Que tipo de nota deseja?: <span className="campo-obrigatório">*</span></label>
            <select value={tipoNota} onChange={(e) => setTipoNota(e.target.value)}>
              <option value="" disabled>Selecione um tipo de Nota Fiscal</option>
              <option value="NF-e">NF-e (Produto)</option>
              <option value="NFC-e">NFC-e (Consumidor)</option>
              <option value="NFS-e">NFS-e (Serviço)</option>
            </select>
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
                  Tipo do item (visível apenas) 
                </label>
                {/* mostramos tipoNota global, mas mantemos campo para compatibilidade */}
                <input readOnly value={tipoNota} placeholder="Selecione o tipo de nota acima" />
              </div>

              <div className="form-group">
                <label htmlFor={`quantidade-${p.id}`}>
                  Quantidade: <span className="campo-obrigatório">*</span>
                </label>
                <input
                  id={`quantidade-${p.id}`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Digite a quantidade"
                  value={p.quantidade}
                  onChange={(e) => handleChange(p.id, "quantidade", e.target.value)}
                />
              </div>
              <div className="form-group input-prefix">
                <label htmlFor={`valor-${p.id}`}>Valor</label>
                <span className="prefix">R$</span>
                <input
                  id={`valor-${p.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={p.valor}
                  onChange={(e) => handleChange(p.id, "valor", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label htmlFor={`info-${p.id}`}>Informação complementar (descrição)</label>
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
      <section className={`transport-section ${tipoNota === "NFC-e" ? "open" : ""}`}>
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
                  <input id="trans-nome" type="text" placeholder="Nome da Empresa" value={transNome} onChange={e=>setTransNome(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="trans-cpf">CPF/CNPJ</label>
                  <input id="trans-cpf" type="text" placeholder="CPF ou CNPJ da Empresa" value={transCpf} onChange={e=>setTransCpf(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="placa">Placa do veículo</label>
                  <input id="placa" type="text" placeholder="000-0000" value={placa} onChange={e=>setPlaca(e.target.value)} />
                </div>
                <div className="form-group input-suffix">
                  <label htmlFor="peso-bruto">Peso Bruto</label>
                  <input id="peso-bruto" type="number" placeholder="0" value={pesoBruto} onChange={e=>setPesoBruto(e.target.value)} />
                  <span className="suffix">Kg</span>
                </div>
                <div className="form-group input-suffix">
                  <label htmlFor="peso-liquido">Peso Líquido</label>
                  <input id="peso-liquido" type="number" placeholder="0" value={pesoLiquido} onChange={e=>setPesoLiquido(e.target.value)} />
                  <span className="suffix">Kg</span>
                </div>
              </div>

              <div className="form-row full">
                <div className="form-group">
                  <label htmlFor="info-transporte">Informação complementar</label>
                  <input id="info-transporte" type="text" placeholder="Observações (opcional)" value={infoTransporte} onChange={e=>setInfoTransporte(e.target.value)} />
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
            <input id="desc-incond" type="number" min="0" step="0.01" placeholder="0,00" value={descIncond} onChange={(e)=>setDescIncond(e.target.value)} />
          </div>
          <div className="form-group input-prefix">
            <label htmlFor="desc-cond">Desconto condicionado</label>
            <span className="prefix">R$</span>
            <input id="desc-cond" type="number" min="0" step="0.01" placeholder="0,00" value={descCond} onChange={(e)=>setDescCond(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="valor-total">Valor Total</label>
            <span className="prefix">R$</span>
            <input id="valor-total" type="number" placeholder="0,00" value={valorTotal} readOnly />
          </div>
        </div>
      </section>

      <div className="form-footer-avancar">
        <Link to="/emitir-nota/Finalizar" onClick={salvarEAvancar}>
          AVANÇAR <i className="bi bi-chevron-double-right"></i><i className="bi bi-chevron-double-right"></i>
        </Link>
      </div>
    </main>
  );
}

export default Tela_1_emitir_nota;
