import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import icons from "../../../components/Icons";
import axios from "axios";

function Editar_produto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", preco_unitario: 0, sku: "", categoria: "", descricao: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://project-finc.onrender.com/produtos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(res.data);
      } catch (error) { alert("Erro ao carregar produto."); }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`https://project-finc.onrender.com/produtos/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Produto atualizado!");
      navigate("/produtos");
    } catch (error) { alert("Erro ao salvar."); }
  };

  return (
    <main className="content">
      <section className="titulo-secao"><h1><i className={icons.produtosAdd}></i> Editar Produto</h1></section>
      <div className="form-footer voltar"><Link to="/produtos" className="previous-step">Voltar</Link></div>
      
      <section className="form-section">
        <div className="form-row">
          <div className="form-group"><label>Nome do Produto *</label>
            <input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="form-group"><label>Preço Unitário</label>
            <input type="number" value={form.preco_unitario} onChange={e => setForm({...form, preco_unitario: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>SKU</label>
            <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
          </div>
          <div className="form-group"><label>Categoria</label>
            <input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
          </div>
        </div>
      </section>
      <div className="botao_geral"><button className="btn" onClick={handleSave}>Salvar Alterações</button></div>
    </main>
  );
}
export default Editar_produto;