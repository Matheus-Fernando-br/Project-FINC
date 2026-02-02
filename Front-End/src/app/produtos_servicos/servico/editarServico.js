import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import icons from "../../../components/Icons";
import axios from "axios";
import '../produtos.css'
import '../../../styles/app.css'

function Editar_servico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", preco: 0, cnae: "", municipio: "" });

  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://project-finc.onrender.com/servicos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(res.data);
      } catch (error) { setFeedback("Erro ao carregar serviço."); }
    };
    fetchData();
  }, [id]);

    const cancelarAlteracoes = () => {
        if (!window.confirm("Deseja cancelar todas as alterações?")) return;
        setLoadingCancel(true);
        setFeedback("Operação cancelada!");
        setTimeout(() => {
        setForm(form);
        setLoadingCancel(false);
        navigate("/produtos");
        }, 1000);
    };

  const handleSave = async () => {
    setFeedback("");
    setLoading(true);
    setFeedback("Atualizando Serviço...");

    try {
      const token = localStorage.getItem("token");
      await axios.put(`https://project-finc.onrender.com/servicos/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback("Serviço atualizado!");
      setTimeout(() => { 
        navigate("/produtos"); }, 2000);

    } catch (error) {
        console.error("Erro ao atualizar dados do serviço:", error);
         setFeedback("Erro ao salvar."); }
  };

  return (
    <main className="content">
      <section className="titulo-secao"><h1><i className={icons.servicosAdd}></i> Editar Serviço</h1></section>
      <div className="form-footer voltar"><Link to="/produtos" className="previous-step">Voltar</Link></div>
      
        <section className="form-section">

        {/* Nome */}
        <div className="form-row">
            <div className="form-group">
            <label>Nome do Serviço <span className="campo-obrigatório">*</span></label>
            <input
                type="text"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder="Informe o nome do serviço"
                disabled={loading}
            />
            </div>
        </div> 

        {/* Categoria + Código Interno */}
        <div className="form-row">
                <div className="form-group"><label>Categoria <span className="campo-obrigatório">*</span></label>
                    <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} disabled={loading}>
                        <option value="" disabled>Selecione a categoria</option>

                            <option>Alimentos</option>
                            <option>Bebidas</option>
                            <option>Limpeza</option>
                            <option>Higiene</option>
                            <option>Perfumaria</option>
                            <option>Cosméticos</option>
                            <option>Papelaria</option>
                            <option>Informática</option>
                            <option>Eletrônicos</option>
                            <option>Eletrodomésticos</option>
                            <option>Eletroportáteis</option>
                            <option>Ferramentas</option>
                            <option>Construção</option>
                            <option>Iluminação</option>
                            <option>Automotivo</option>
                            <option>Peças automotivas</option>
                            <option>Acessórios automotivos</option>
                            <option>Jardinagem</option>
                            <option>Pet shop</option>
                            <option>Brinquedos</option>
                            <option>Cama mesa e banho</option>
                            <option>Móveis</option>
                            <option>Decoração</option>
                            <option>Esportes</option>
                            <option>Fitness</option>
                            <option>Moda</option>
                            <option>Calçados</option>
                            <option>Acessórios</option>
                            <option>Óticas</option>
                            <option>Relógios</option>
                            <option>Jóias</option>
                            <option>Suplementos</option>
                            <option>Farmácia</option>
                            <option>Medicamentos</option>
                            <option>Nutrição</option>
                            <option>Equipamentos médicos</option>
                            <option>Hospitalar</option>
                            <option>Segurança</option>
                            <option>Vestuário profissional</option>
                            <option>Uniformes</option>
                            <option>Escritório</option>
                            <option>Organização</option>
                            <option>Armazenamento</option>
                            <option>Embalagens</option>
                            <option>Descartáveis</option>
                            <option>Artigos para festa</option>
                            <option>Bebê</option>
                            <option>Crianças</option>
                            <option>Papel e impressão</option>
                            <option>Tintas</option>
                            <option>Químicos</option>
                            <option>Materiais escolares</option>
                            <option>Hardware</option>
                            <option>Software</option>
                            <option>Games</option>
                            <option>Telefonia</option>
                            <option>Aparelhos celulares</option>
                            <option>Acessórios de celular</option>
                            <option>Rede e internet</option>
                            <option>Câmeras</option>
                            <option>Foto e vídeo</option>
                            <option>Automação residencial</option>
                            <option>Energia solar</option>
                            <option>Gás e combustíveis</option>
                            <option>Supermercado</option>
                            <option>Mercearia</option>
                            <option>Padaria</option>
                            <option>Hortifruti</option>
                            <option>Açougue</option>
                            <option>Frios e laticínios</option>
                            <option>Peixes e frutos do mar</option>
                            <option>Confeitaria</option>
                            <option>Bolos e doces</option>
                            <option>Café e chás</option>
                            <option>Cervejas</option>
                            <option>Vinhos</option>
                            <option>Destilados</option>
                            <option>Utilidades domésticas</option>
                            <option>Cozinha</option>
                            <option>Banheiro</option>
                            <option>Lavanderia</option>
                            <option>Piscina</option>
                            <option>Camping</option>
                            <option>Pesca</option>
                            <option>Livros</option>
                            <option>Revistas</option>
                            <option>Artesanato</option>
                            <option>Artigos religiosos</option>
                            <option>Artigos musicais</option>
                            <option>Instrumentos musicais</option>
                            <option>Suprimentos industriais</option>
                            <option>Metalúrgica</option>
                            <option>Madeira e marcenaria</option>
                            <option>Vidraçaria</option>
                            <option>Serralheria</option>
                            <option>Pneus</option>
                            <option>Lubrificantes</option>
                            <option>Transportes</option>
                            <option>Serviços gerais</option>
                            <option>Consultoria</option>
                            <option>Marketing</option>
                            <option>Design</option>
                            <option>Engenharia</option>
                            <option>Arquitetura</option>
                            <option>Manutenção</option>
                            <option>Consertos</option>
                            <option>Instalações</option>
                            <option>Refrigeração</option>
                            <option>Climatização</option>
                            <option>Eventos</option>
                            <option>Fotografia</option>
                            <option>Beleza e estética</option>
                            <option>Cabeleireiro</option>
                            <option>Barbearia</option>
                            <option>Estética facial</option>
                            <option>Estética corporal</option>
                            <option>Massoterapia</option>
                            <option>Educação</option>
                            <option>Cursos</option>
                            <option>Treinamentos</option>
                            <option>Idiomas</option>
                            <option>Tecnologia</option>
                            <option>Cloud</option>
                            <option>Serviços digitais</option>

                    </select>
                </div>


            <div className="form-group">
            <label>Código Interno / SKU</label>
            <input
                type="text"
                value={form.codigo_interno}
                onChange={e => setForm({ ...form, codigo_interno: e.target.value })}
                placeholder="Informe o código interno/SKU"
                disabled={loading}
            />
            </div>
        </div>

        {/* Descrição */}
        <div className="form-row">
            <div className="form-group">
            <label>Descrição Detalhada</label>
            <textarea
                rows="4"
                value={form.descricao_detalhada}
                onChange={e => setForm({ ...form, descricao_detalhada: e.target.value })}
                placeholder=" Descreva o serviço"
                disabled={loading}
            />
            </div>
        </div>

        {/* Preço + Unidade */}
        <div className="form-row">
            <div className="form-group input-prefix">
            <label>Preço <span className="campo-obrigatório">*</span></label>
            <span className="prefix">R$</span>
            <input
                type="number"
                step="0.01"
                value={form.preco}
                onChange={e => setForm({ ...form, preco: e.target.value })}
                placeholder="Informe o preço unitário do serviço"
                disabled={loading}
            />
            </div>

            <div className="form-group"><label>Unidade de Medida <span className="campo-obrigatório">*</span></label>
                <select value={form.unidade_medida} onChange={e => setForm({...form, unidade_medida: e.target.value})} disabled={loading}>
                    <option value="" disabled>Selecione a unidade</option>

                    <option>Unidade</option>
                    <option>Peça</option>
                    <option>Dúzia</option>
                    <option>Fardo</option>
                    <option>Saco</option>
                    <option>Caixa</option>
                    <option>Kit</option>
                    <option>Pacote</option>
                    <option>Jogo</option>
                    <option>Par</option>
                    <option>Rolo</option>
                    <option>Frasco</option>
                    <option>Amostra</option>
                    <option>Quilograma</option>
                    <option>Grama</option>
                    <option>Miligrama</option>
                    <option>Tonelada</option>
                    <option>Libra</option>
                    <option>Onça</option>
                    <option>Litro</option>
                    <option>Mililitro</option>
                    <option>Centilitro</option>
                    <option>Metro cúbico</option>
                    <option>Galão</option>
                    <option>Metro</option>
                    <option>Centímetro</option>
                    <option>Milímetro</option>
                    <option>Quilômetro</option>
                    <option>Polegada</option>
                    <option>Pé</option>
                    <option>Metro quadrado</option>
                    <option>Centímetro quadrado</option>
                    <option>Pé quadrado</option>
                    <option>Hora</option>
                    <option>Minuto</option>
                    <option>Segundo</option>
                    <option>Dia</option>
                    <option>Saca</option>
                    <option>Arroba</option>
                    <option>Hectare</option>

                </select>
            </div>
        </div>

        {/* CNAE + Código Serviço */}
        <div className="form-row">
            <div className="form-group">
            <label>CNAE <span className="campo-obrigatório">*</span></label>
            <input
                type="text"
                value={form.cnae}
                onChange={e => setForm({ ...form, cnae: e.target.value })}
                placeholder="Informe o código CNAE referente o serviço"
                disabled={loading}            
            />
            </div>

            <div className="form-group">
            <label>Código do Serviço <span className="campo-obrigatório">*</span></label>
            <input
                type="text"
                value={form.codigo_servico}
                onChange={e => setForm({ ...form, codigo_servico: e.target.value })}
                placeholder="Informe o código de serviço"
                disabled={loading}
            />
            </div>
        </div>

        {/* Item Lista + Alíquota ISS */}
        <div className="form-row">
            <div className="form-group">
            <label>Item da Lista (LC 116)</label>
            <input
                type="text"
                value={form.item_lista}
                onChange={e => setForm({ ...form, item_lista: e.target.value })}
                placeholder="Informe o Item da Lista"
                disabled={loading}
            />
            </div>

            <div className="form-group input-suffix">
            <label>Alíquota ISS</label>
            <span className="suffix">%</span>
            <input
                type="number"
                step="0.01"
                value={form.aliquota_iss}
                onChange={e => setForm({ ...form, aliquota_iss: e.target.value })}
                placeholder="Informe o valor de ISS"
                disabled={loading}
            />
            </div>
        </div>

        {/* CST PIS/COFINS + Regime Especial */}
        <div className="form-row">
            <div className="form-group input-suffix">
            <label>CST PIS/COFINS</label>
            <span className="suffix">%</span>
            <input
                type="text"
                value={form.cst_pis_cofins}
                onChange={e => setForm({ ...form, cst_pis_cofins: e.target.value })}
                placeholder="Informe o COFINS"
                disabled={loading}
            />
            </div>

            <div className="form-group">
            <label>Regime Especial</label>
            <input
                type="text"
                value={form.regime_especial}
                onChange={e => setForm({ ...form, regime_especial: e.target.value })}
                placeholder="Informe a taxa de regime especial"
                disabled={loading}
            />
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
            <label>Município</label>
            <input
                type="text"
                value={form.municipio}
                onChange={e => setForm({ ...form, municipio: e.target.value })}
                placeholder="Informe o Municío que foi prestado o serviço"
                disabled={loading}
            />
            </div>
        </div>

        </section>
        {feedback && <p className="feedback">{feedback}</p>}
      <div className="botao_geral">
        <button className="btn btn-cancelar" onClick={cancelarAlteracoes} disabled={loading}> 
          {loadingCancel && <span className="spinner"></span>}
          {loadingCancel ? "" : "Cancelar Alterações"}
        </button>

        <button className="btn" onClick={handleSave}>
          {loading && <span className="spinner"></span>}
          {loading ? "" : "Salvar Alterações"}
        </button>
    </div>
    </main>
  );
}
export default Editar_servico;