import Layout from '../components/Layout';
import icons from "../components/Icons";
import React from "react";
import {
BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

function Home() {

// Dados simulados
const clientes = [
{ nome: "Cliente A", compras: 120 },
{ nome: "Cliente B", compras: 95 },
{ nome: "Cliente C", compras: 70 },
{ nome: "Cliente D", compras: 50 }
];

const produtos = [
{ nome: "Produto X", vendas: 200 },
{ nome: "Produto Y", vendas: 150 },
{ nome: "Produto Z", vendas: 80 },
{ nome: "Produto W", vendas: 40 }
];

const notasEmitidas = [
{ ano: "2022", qtd: 300 },
{ ano: "2023", qtd: 500 },
{ ano: "2024", qtd: 750 },
{ ano: "2025", qtd: 1200 }
];

const distribuicaoProdutos = [
{ name: "Produto X", value: 200 },
{ name: "Produto Y", value: 150 },
{ name: "Produto Z", value: 80 },
{ name: "Produto W", value: 40 }
];

const COLORS = ["#2ecc71", "#27ae60", "#0d6630", "#063e20"];

return ( <Layout> <main className="content">

    <section className="titulo-secao">
      <h1><i className={icons.casa}></i> Dashboard de Indicadores</h1>
    </section>

    {/* Estatísticas Rápidas */}
    <section className="form-section">
      <div className="section-header">
        <span className="icon"><i className="bi bi-bar-chart-fill"></i></span>
        <h3>Visão Geral</h3>
      </div>
      <hr className="divider" />
      <div className="form-row">
        <div className="form-group">
          <h2>+1500</h2>
          <p>Clientes Cadastrados</p>
        </div>
        <div className="form-group">
          <h2>+4200</h2>
          <p>Produtos Vendidos</p>
        </div>
        <div className="form-group">
          <h2>+1200</h2>
          <p>Notas Emitidas</p>
        </div>
      </div>
    </section>

    {/* Gráfico de Barras - Clientes que mais compram */}
    <section className="form-section">
      <div className="section-header">
        <span className="icon"><i className="bi bi-people-fill"></i></span>
        <h3>Clientes que mais compram</h3>
      </div>
      <hr className="divider" />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={clientes}>
          <XAxis dataKey="nome" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="compras" fill="#2ecc71" />
        </BarChart>
      </ResponsiveContainer>
    </section>

    {/* Gráfico de Colunas - Produtos mais vendidos */}
    <section className="form-section">
      <div className="section-header">
        <span className="icon"><i className="bi bi-box-seam"></i></span>
        <h3>Produtos mais vendidos</h3>
      </div>
      <hr className="divider" />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={produtos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nome" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="vendas" fill="#27ae60" />
        </BarChart>
      </ResponsiveContainer>
    </section>

    {/* Gráfico de Linha - Notas emitidas */}
    <section className="form-section">
      <div className="section-header">
        <span className="icon"><i className="bi bi-receipt"></i></span>
        <h3>Evolução de Notas Emitidas</h3>
      </div>
      <hr className="divider" />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={notasEmitidas}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ano" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="qtd" stroke="#0d6630" />
        </LineChart>
      </ResponsiveContainer>
    </section>

    {/* Gráfico de Pizza - Distribuição de vendas por produto */}
    <section className="form-section">
      <div className="section-header">
        <span className="icon"><i className="bi bi-pie-chart-fill"></i></span>
        <h3>Distribuição de Vendas por Produto</h3>
      </div>
      <hr className="divider" />
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={distribuicaoProdutos}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {distribuicaoProdutos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </section>

  </main>
</Layout>

);
}

export default Home;
