import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import icons from "../../../components/Icons";
import axios from "axios";
import '../produtos.css'
import '../../../styles/app.css'

function Editar_produto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", preco_unitario: 0, sku: "", categoria: "", descricao: "" });

  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://project-finc.onrender.com/produtos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(res.data);
      } catch (error) { setFeedback("Erro ao carregar produto."); }
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
    setFeedback("Atualizando Produto...");

    try {
      const token = localStorage.getItem("token");
      await axios.put(`https://project-finc.onrender.com/produtos/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback("Produto atualizado!");
      setTimeout(() => { 
        navigate("/produtos"); }, 2000);
     
    } catch (error) {
      console.error("Erro ao atualizar dados do produto:", error);
      setFeedback("Erro ao salvar."); }
  };

  return (
    <main className="content">
      <section className="titulo-secao"><h1><i className={icons.produtosAdd}></i> Editar Produto</h1></section>
      <div className="form-footer voltar"><Link to="/produtos" className="previous-step">Voltar</Link></div>
        <section className="form-section">
            <div className="form-row">
                <div className="form-group"><label>Nome <span className="campo-obrigatório">*</span></label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Informe o nome do Produto" disabled={loading}/></div>
                <div className="form-group"><label>Fabricante <span className="campo-obrigatório">*</span></label><input type="text" value={form.fabricante} onChange={e => setForm({...form, fabricante: e.target.value})} placeholder="Informe o Fabricante do Produto" disabled={loading}/></div>
            </div>
            <div className='form-row'>
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
                <div className="form-group"><label>SKU <span className="campo-obrigatório">*</span></label><input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Informe o código do seu produto" disabled={loading}/></div>
            </div>
            <div className='form-row'>
                <div className="form-group">
                    <label>Descrição </label>
                    <input type="text" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} placeholder="Descreva seu produto..." disabled={loading}/>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group input-prefix"><label>Preço <span className="campo-obrigatório">*</span></label><span className="prefix">R$</span><input type="number" value={form.preco_unitario} onChange={e => setForm({...form, preco_unitario: e.target.value})} placeholder="Informe o preço unitário" disabled={loading}/></div>
                <div className="form-group"><label>NCM <span className="campo-obrigatório">*</span></label><input type="text" value={form.ncm} onChange={e => setForm({...form, ncm: e.target.value})} placeholder="Informe o código NCM" disabled={loading}/></div>
                <div className="form-group"><label>CFOP <span className="campo-obrigatório">*</span></label><input type="text" value={form.cfop} onChange={e => setForm({...form, cfop: e.target.value})} placeholder="Informe o código CFOP" disabled={loading}/></div>
            </div>
            <div className="form-row">
                <div className="form-group input-suffix"><label>ICMS <span className="campo-obrigatório">*</span></label><span className="suffix">%</span><input type="text" value={form.icms} onChange={e => setForm({...form, icms: e.target.value})} placeholder="Informe o ICMS" disabled={loading}/></div>
                <div className="form-group input-suffix"><label>COFINS <span className="campo-obrigatório">*</span></label><span className="suffix">%</span><input type="text" value={form.pis_cofins} onChange={e => setForm({...form, pis_cofins: e.target.value})} placeholder="Informe o COFINS" disabled={loading}/></div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Origem do Produto <span className="campo-obrigatório">*</span></label>
                    <select value={form.origem} onChange={e => setForm({...form, origem: e.target.value})} disabled={loading}>
                        <option value="" disabled>Selecione a origem</option>

                        <option value="0">0 - Nacional</option>
                        <option value="1">1 - Estrangeira - Importação direta</option>
                        <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
                        <option value="3">3 - Nacional com conteúdo de importação superior a 40%</option>
                        <option value="4">4 - Nacional conforme processos produtivos básicos (PPB)</option>
                        <option value="5">5 - Nacional com conteúdo de importação inferior ou igual a 40%</option>
                        <option value="6">6 - Estrangeira - Importação direta, sem similar nacional, constante em lista da CAMEX</option>
                        <option value="7">7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista da CAMEX</option>
                        <option value="8">8 - Nacional - Mercadoria ou bem com Conteúdo de Importação superior a 70%</option>

                    </select>
                </div>
            </div>
        </section>
        {feedback && <p className="feedback">{feedback}</p>}
      <div className="botao_geral">
        <button className="btn btn-cancelar" onClick={cancelarAlteracoes} disabled={loading}> 
          {loadingCancel && <span className="spinner"></span>}
          {loadingCancel ? "" : "Cancelar Alterações"}
        </button>

        <button className="btn" onClick={handleSave} disabled={loading}>
          {loading && <span className="spinner"></span>}
          {loading ? "" : "Salvar Alterações"}
        </button></div>
    </main>
  );
}
export default Editar_produto;