// Front-End/src/app/emitir-nota/Tela_1_emitir_nota.jsx
import React, { useEffect, useState } from "react";
import "./emitir-nota.css";
import icons from "../../components/Icons";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

const ANIM_MS = 320;
const STORAGE_KEY = "emitirNotaData";

function Tela_1_emitir_nota() {
  const [incluirFrete, setIncluirFrete] = useState("nao");
  const navigate = useNavigate();
  const [produtosServicos, setProdutosServicos] = useState([
    {
      id: Date.now(),
      item: "",
      tipoNotaItem: "",
      categoriaItem: "",
      quantidade: 1,
      valor: 0,
      info: "",
      isOpen: true,
    },
  ]);

  const [tipoNota, setTipoNota] = useState("");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState("");
  const [clienteCompleto, setClienteCompleto] = useState(null);

  const [listaClientes, setListaClientes] = useState([]);
  const [listaItens, setListaItens] = useState([]);

  const [transNome, setTransNome] = useState("");
  const [transCpf, setTransCpf] = useState("");
  const [placa, setPlaca] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");
  const [pesoLiquido, setPesoLiquido] = useState("");
  const [infoTransporte, setInfoTransporte] = useState("");

  const [descIncond, setDescIncond] = useState(0);
  const [descCond, setDescCond] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);

  const [obsGeral, setObsGeral] = useState("");

  useEffect(() => {
    const voltar = localStorage.getItem("emitirNotaVoltar") === "1";
    const saved = localStorage.getItem(STORAGE_KEY);

    if (voltar && saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj && obj.produtosServicos) {
          setProdutosServicos(obj.produtosServicos);
          setTipoNota(obj.tipoNota || "");
          setClienteNome(obj.clienteNome || "");
          setClienteCpfCnpj(obj.clienteCpfCnpj || "");
          setClienteCompleto(obj.clienteCompleto || null);

          setIncluirFrete(obj.incluirFrete || "nao");
          setTransNome(obj.transNome || "");
          setTransCpf(obj.transCpf || "");
          setPlaca(obj.placa || "");
          setPesoBruto(obj.pesoBruto || "");
          setPesoLiquido(obj.pesoLiquido || "");
          setInfoTransporte(obj.infoTransporte || "");

          setDescIncond(obj.descIncond || 0);
          setDescCond(obj.descCond || 0);
          setObsGeral(obj.obsGeral || "");
        }
      } catch {}
    } else {
      // ✅ fluxo novo: limpa tudo
      localStorage.removeItem(STORAGE_KEY);
      setTipoNota("");
      setClienteNome("");
      setClienteCpfCnpj("");
      setClienteCompleto(null);

      setIncluirFrete("nao");
      setTransNome("");
      setTransCpf("");
      setPlaca("");
      setPesoBruto("");
      setPesoLiquido("");
      setInfoTransporte("");

      setDescIncond(0);
      setDescCond(0);
      setObsGeral("");

      setProdutosServicos([
        {
          id: Date.now(),
          item: "",
          tipoNotaItem: "",
          categoriaItem: "",
          quantidade: 1,
          valor: 0,
          info: "",
          isOpen: true,
        },
      ]);
    }

    // ✅ consome o flag
    localStorage.removeItem("emitirNotaVoltar");
  }, []);

  function validarAntesDeAvancar() {
    if (!clienteCompleto?.id) {
      alert("Selecione um cliente.");
      return false;
    }

    if (!tipoNota) {
      alert("Selecione o tipo de nota (NF-e / NFC-e / NFS-e).");
      return false;
    }

    const itensValidos = (produtosServicos || []).filter((p) => {
      const qtd = Number(p.quantidade) || 0;
      const valor = Number(p.valor) || 0;
      return p.item && qtd > 0 && valor >= 0;
    });

    if (itensValidos.length === 0) {
      alert("Adicione pelo menos 1 produto/serviço com quantidade válida.");
      return false;
    }

    return true;
  }

  const avancar = () => {
    if (!validarAntesDeAvancar()) return;

    salvarEAvancar();
    navigate("/emitir-nota/Finalizar");
  };

  /* =======================
     AJUSTE PRINCIPAL AQUI
     ======================= */
  useEffect(() => {
    async function carregarClientes() {
      try {
        const data = await apiFetch("/clientes", {
          method: "GET",
        });

        const formatados = data.map((c) => ({
          id: c.id,
          nome_social: c.nome_social || "Nome não informado",
          cpf_cnpj: c.cpf_cnpj,
          categoria: c.tipo_pessoa === "PJuridica" ? "PJ" : "PF",
          email: c.email,
          telefone: c.telefone,
          cep: c.cep,
          uf: c.uf,
          cidade: c.cidade,
          logradouro: c.logradouro,
          bairro: c.bairro,
          numero: c.numero,
          complemento: c.complemento,
        }));

        setListaClientes(formatados);
      } catch (error) {
        console.error("Erro ao buscar clientes (detalhado):", error);
        console.error("Mensagem:", error?.message);
        console.error("Token:", localStorage.getItem("token"));
      }
    }

    carregarClientes();
  }, []);

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

  const [, setCalculoImpostos] = useState({
    baseICMS: 0,
    valorICMS: 0,
    baseISS: 0,
    valorISS: 0,
    valorProdutos: 0,
    valorServicos: 0,
    valorIPI: 0,
    totalNota: 0,
  });

  useEffect(() => {
    let baseICMS = 0;
    let valorICMS = 0;
    let baseISS = 0;
    let valorISS = 0;
    let valorProdutos = 0;
    let valorServicos = 0;

    produtosServicos.forEach((item) => {
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

    const descontos = (Number(descIncond) || 0) + (Number(descCond) || 0);

    const totalNota =
      valorProdutos + valorServicos + valorICMS + valorISS - descontos;

    setCalculoImpostos({
      baseICMS: baseICMS.toFixed(2),
      valorICMS: valorICMS.toFixed(2),
      baseISS: baseISS.toFixed(2),
      valorISS: valorISS.toFixed(2),
      valorProdutos: valorProdutos.toFixed(2),
      valorServicos: valorServicos.toFixed(2),
      valorIPI: "0.00",
      totalNota: totalNota.toFixed(2),
    });
  }, [produtosServicos, descIncond, descCond]);

  const addProdutoServico = () => {
    const id = Date.now() + Math.random();
    const newItem = {
      id,
      item: "",
      tipoNotaItem: "",
      categoriaItem: "",
      quantidade: 1,
      valor: 0,
      info: "",
      isOpen: false,
    };

    setProdutosServicos((prev) => [...prev, newItem]);
    setTimeout(() => {
      setProdutosServicos((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isOpen: true } : x)),
      );
    }, 20);
  };

  const removeProdutoServico = (id) => {
    setProdutosServicos((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isOpen: false } : x)),
    );
    setTimeout(() => {
      setProdutosServicos((prev) => prev.filter((x) => x.id !== id));
    }, ANIM_MS + 20);
  };

  const handleChange = (id, field, value) => {
    setProdutosServicos((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    );
  };

  const handleSelectNome = (e) => {
    const nome = e.target.value;
    setClienteNome(nome);

    const cliente = listaClientes.find((c) => c.nome_social === nome);
    if (cliente) {
      setClienteCpfCnpj(cliente.cpf_cnpj);
      setClienteCompleto(cliente);
    }
  };

  const handleSelectCpfCnpj = (e) => {
    const cpf = e.target.value;
    setClienteCpfCnpj(cpf);

    const cliente = listaClientes.find((c) => c.cpf_cnpj === cpf);
    if (cliente) {
      setClienteNome(cliente.nome_social);
      setClienteCompleto(cliente);
    }
  };

  const salvarEAvancar = () => {
    const payload = {
      tipoNota,
      incluirFrete,
      produtosServicos,
      clienteNome,
      clienteCpfCnpj,
      clienteCompleto,
      transNome,
      transCpf,
      placa,
      pesoBruto,
      pesoLiquido,
      infoTransporte,
      descIncond,
      descCond,
      valorTotal,
      obsGeral,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  useEffect(() => {
    async function carregarItens() {
      try {
        const [produtosData, servicosData] = await Promise.all([
          apiFetch("/produtos", { method: "GET" }),
          apiFetch("/servicos", { method: "GET" }),
        ]);

        const produtos = (produtosData || []).map((p) => ({
          ...p,
          tipo: "produto",
          nomeExibicao: p.nome,
          preco: Number(p.preco_unitario),
          categoria: p.categoria,
        }));

        const servicos = (servicosData || []).map((s) => ({
          ...s,
          tipo: "servico",
          nomeExibicao: s.nome,
          preco: Number(s.preco),
          categoria: s.categoria,
        }));

        setListaItens([...produtos, ...servicos]);
      } catch (err) {
        console.error("Erro ao carregar produtos/serviços:", err);
      }
    }

    carregarItens();
  }, []);

  const itensDisponiveis = listaItens.filter((item) => {
    if (tipoNota === "NFS-e") return item.tipo === "servico";
    if (tipoNota === "NF-e" || tipoNota === "NFC-e")
      return item.tipo === "produto";
    return false;
  });

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.emitirNota}></i> Emitir Nota Fiscal
        </h1>
      </section>

      {/* Cliente */}
      <section className="form-section">
        <p className="frase-campo-asterisco">
          Os campos que contêm um asterisco (
          <span className="campo-obrigatório">*</span>) são obrigatórios.
        </p>
        <div className="section-header">
          <span className="icon">
            <i className={icons.clientes}></i>
          </span>
          <h3>Cliente</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nome-social">
              Nome Social <span className="campo-obrigatório">*</span>
            </label>
            <select
              id="nome-social"
              value={clienteNome}
              onChange={handleSelectNome}
            >
              <option value="">Selecione</option>
              {listaClientes.map((cli) => (
                <option key={cli.id} value={cli.nome_social}>
                  {cli.nome_social}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cpf-cnpj">
              CPF/CNPJ <span className="campo-obrigatório">*</span>
            </label>
            <select
              id="cpf-cnpj"
              value={clienteCpfCnpj}
              onChange={handleSelectCpfCnpj}
              disabled
            >
              <option value="">Selecione</option>
              {listaClientes.map((cli) => (
                <option key={cli.id} value={cli.cpf_cnpj}>
                  {cli.cpf_cnpj}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Tipo de Nota (isolado e único) */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.produtos}></i>
          </span>
          <h3>Tipo de Nota (aplica a todos os itens)</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label>
              Que tipo de nota deseja?:{" "}
              <span className="campo-obrigatório">*</span>
            </label>
            <select
              value={tipoNota}
              onChange={(e) => setTipoNota(e.target.value)}
            >
              <option value="" disabled>
                Selecione um tipo de Nota Fiscal
              </option>
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
          <span className="icon">
            <i className={icons.produtos}></i>
          </span>
          <h3>Produto/Serviço</h3>
        </div>
        <hr className="divider" />

        {produtosServicos.map((p) => (
          <div
            key={p.id}
            className={`produto-servico-bloco ${p.isOpen ? "open" : ""}`}
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor={`item-${p.id}`}>
                  Selecione o produto/serviço:{" "}
                  <span className="campo-obrigatório">*</span>
                </label>
                <select
                  id={`item-${p.id}`}
                  value={p.item}
                  disabled={!tipoNota}
                  onChange={(e) => {
                    const itemSelecionado = itensDisponiveis.find(
                      (i) => String(i.id) === e.target.value,
                    );

                    if (!itemSelecionado) return;

                    setProdutosServicos((prev) =>
                      prev.map((x) =>
                        x.id === p.id
                          ? {
                              ...x,
                              item: itemSelecionado.id,
                              nome: itemSelecionado.nomeExibicao,
                              valor: itemSelecionado.preco,
                              categoriaItem: itemSelecionado.categoria,

                              // 👇 DADOS FISCAIS
                              icms: itemSelecionado.icms || 0,
                              pis_cofins: itemSelecionado.pis_cofins || 0,
                              aliquota_iss: itemSelecionado.aliquota_iss || 0,
                              tipo: itemSelecionado.tipo, // produto | servico
                            }
                          : x,
                      ),
                    );
                  }}
                >
                  <option value="">
                    {!tipoNota
                      ? "Selecione o tipo de nota primeiro"
                      : tipoNota === "NFS-e"
                        ? "Selecione um serviço"
                        : "Selecione um produto"}
                  </option>

                  {itensDisponiveis.map((item) => (
                    <option key={`${item.tipo}-${item.id}`} value={item.id}>
                      {item.nomeExibicao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoria</label>
                <input
                  readOnly
                  value={p.categoriaItem}
                  placeholder="Categoria do item"
                  disabled
                />
              </div>

              <div className="form-group input-prefix">
                <label htmlFor={`valor-${p.id}`}>Valor Unitário</label>
                <span className="prefix">R$</span>
                <input
                  id={`valor-${p.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.valor}
                  disabled
                />
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
                  onChange={(e) => {
                    const qtd = Number(e.target.value) || 0;

                    setProdutosServicos((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, quantidade: qtd } : x,
                      ),
                    );
                  }}
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label htmlFor={`info-${p.id}`}>
                  Informação complementar (descrição)
                </label>
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
              <button
                type="button"
                className="btn-remover"
                onClick={() => removeProdutoServico(p.id)}
              >
                Remover Produto/Serviço
              </button>
            )}
            <hr className="divider" />
          </div>
        ))}

        <button
          type="button"
          className="btn-adicionar"
          onClick={addProdutoServico}
        >
          + Adicionar Produto/Serviço
        </button>
      </section>

      {/* Transporte */}
      <section
        className={`transport-section ${tipoNota === "NFC-e" ? "open" : ""}`}
      >
        <div className="transport-inner">
          <section className="form-section">
            <div className="section-header">
              <span className="icon">
                <i className={icons.transporte}></i>
              </span>
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

            <div
              className={`transport-panel ${incluirFrete === "sim" ? "open" : ""}`}
            >
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="trans-nome">Nome Social</label>
                  <input
                    id="trans-nome"
                    type="text"
                    placeholder="Nome da Empresa"
                    value={transNome}
                    onChange={(e) => setTransNome(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="trans-cpf">CPF/CNPJ</label>
                  <input
                    id="trans-cpf"
                    type="text"
                    placeholder="CPF ou CNPJ da Empresa"
                    value={transCpf}
                    onChange={(e) => setTransCpf(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="placa">Placa do veículo</label>
                  <input
                    id="placa"
                    type="text"
                    placeholder="000-0000"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                  />
                </div>
                <div className="form-group input-suffix">
                  <label htmlFor="peso-bruto">Peso Bruto</label>
                  <input
                    id="peso-bruto"
                    type="number"
                    placeholder="0"
                    value={pesoBruto}
                    onChange={(e) => setPesoBruto(e.target.value)}
                  />
                  <span className="suffix">Kg</span>
                </div>
                <div className="form-group input-suffix">
                  <label htmlFor="peso-liquido">Peso Líquido</label>
                  <input
                    id="peso-liquido"
                    type="number"
                    placeholder="0"
                    value={pesoLiquido}
                    onChange={(e) => setPesoLiquido(e.target.value)}
                  />
                  <span className="suffix">Kg</span>
                </div>
              </div>

              <div className="form-row full">
                <div className="form-group">
                  <label htmlFor="info-transporte">
                    Informação complementar
                  </label>
                  <input
                    id="info-transporte"
                    type="text"
                    placeholder="Observações (opcional)"
                    value={infoTransporte}
                    onChange={(e) => setInfoTransporte(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Valores */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.moeda}></i>
          </span>
          <h3>Valores</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="desc-incond">Desconto incondicionado</label>
            <span className="prefix">R$</span>
            <input
              id="desc-incond"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={descIncond}
              onChange={(e) => setDescIncond(e.target.value)}
            />
          </div>
          <div className="form-group input-prefix">
            <label htmlFor="desc-cond">Desconto condicionado</label>
            <span className="prefix">R$</span>
            <input
              id="desc-cond"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={descCond}
              onChange={(e) => setDescCond(e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="valor-total">Valor Total</label>
            <span className="prefix">R$</span>
            <input
              id="valor-total"
              type="number"
              placeholder="0,00"
              value={valorTotal}
              readOnly
              disabled
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorio}></i>
          </span>
          <h3>Observações gerais da nota</h3>
        </div>
        <hr className="divider" />
        <div className="form-row full">
          <div className="form-group">
            <label>Observação geral (vai para “Dados Adicionais”)</label>
            <textarea
              value={obsGeral}
              onChange={(e) => setObsGeral(e.target.value)}
              placeholder="Ex.: Pedido 123, pagamento via PIX, entregue em mãos..."
              rows={4}
            />
          </div>
        </div>
      </section>

      <div className="form-footer-avancar">
        <button type="button" onClick={avancar} className="next-step">
          AVANÇAR <i className="bi bi-chevron-double-right"></i>
          <i className="bi bi-chevron-double-right"></i>
        </button>
      </div>
    </main>
  );
}

export default Tela_1_emitir_nota;
