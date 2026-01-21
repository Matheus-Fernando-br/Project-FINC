import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import icons from "../../../components/Icons";
import axios from "axios";

function Editar_servico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", preco: 0, cnae: "", municipio: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`https://project-finc.onrender.com/servicos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(res.data);
      } catch (error) { alert("Erro ao carregar serviço."); }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`https://project-finc.onrender.com/servicos/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Serviço atualizado!");
      navigate("/produtos");
    } catch (error) { alert("Erro ao salvar."); }
  };

  return (
    <main className="content">
      <section className="titulo-secao"><h1><i className={icons.servicosAdd}></i> Editar Serviço</h1></section>
      <div className="form-footer voltar"><Link to="/produtos" className="previous-step">Voltar</Link></div>
      
      <section className="form-section">
        <div className="form-row">
          <div className="form-group"><label>Nome do Serviço *</label>
            <input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="form-group"><label>Preço</label>
            <input type="number" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>CNAE</label>
            <input type="text" value={form.cnae} onChange={e => setForm({...form, cnae: e.target.value})} />
          </div>
          <div className="form-group"><label>Município</label>
            <input type="text" value={form.municipio} onChange={e => setForm({...form, municipio: e.target.value})} />
          </div>
        </div>
      </section>
      <div className="botao_geral"><button className="btn" onClick={handleSave}>Salvar Alterações</button></div>
    </main>
  );
}
export default Editar_servico;