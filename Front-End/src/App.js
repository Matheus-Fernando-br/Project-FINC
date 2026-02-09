import { Routes, Route, useLocation } from "react-router-dom";
import AnimatedRoutes from "./components/AnimatedRoutes";

import "./styles/global.css";

// Landing / Pré-login
import LayoutTelaInicial from "./TelaInicial/LayoutTelaInicial";
import HomeTelaInicial from "./TelaInicial/HomeTelaInicial";
import Planos from "./TelaInicial/planos/Planos";
import QuemSomos from "./TelaInicial/quemSomos/QuemSomos";
import Duvidas from "./TelaInicial/duvidas/Duvidas";
import Login from "./TelaInicial/login/Login";
import CadastroLogin from "./TelaInicial/login/cadastro/CadastroLogin";
import Termos from "./TelaInicial/login/cadastro/Termos";

// Pós-login
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/app/Layout";
import Home from "./app/Home";

import Tela1EmitirNota from "./app/emitir-nota/tela1EmitirNota";
import Tela2EmitirNota from "./app/emitir-nota/tela2EmitirNota";

import MeusDados from "./app/meusDados/MeusDados";

import Tela1Clientes from "./app/clientes/tela1Clientes";
import CadastroCliente from "./app/clientes/cadastroCliente";
import EditarCliente from "./app/clientes/editarCliente";

import Tela1Produtos from "./app/produtos_servicos/tela1";
import CadastroProdutos from "./app/produtos_servicos/tela2Escolha";
import CadastroProdutosPlanilha from "./app/produtos_servicos/tela3EscolhaPlanilha";

import TelaCadastroProduto from "./app/produtos_servicos/produto/telaCadastroProduto";
import TelaCadastroServico from "./app/produtos_servicos/servico/telaCadastroServico";

import EditarProduto from "./app/produtos_servicos/produto/editarProduto";
import EditarServico from "./app/produtos_servicos/servico/editarServico";

import Tela1Notificacao from "./app/notificacao/tela1Notificacao";
import Tela1Planos from "./app/planos/tela1Planos";
import Configuracao from "./app/configuracao/configuracao";
import Tela1Contador from "./app/contador/tela1Contador";
import MenuSair from "./app/sair/MenuSair";

import Tela2PlanilhaClientes from "./app/clientes/tela2PlanilhaClientes";
import Tela2PlanilhaProduto from "./app/produtos_servicos/produto/telaPlanilhaProduto";
import Tela2PlanilhaServico from "./app/produtos_servicos/servico/telaPlanilhaServico";

export default function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      {/* 🔥 PRÉ-LOGIN COM ANIMAÇÃO */}
      <Route
        path="/"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <HomeTelaInicial />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      <Route
        path="/TelaInicial/Planos"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <Planos />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      <Route
        path="/TelaInicial/QuemSomos"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <QuemSomos />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      <Route
        path="/TelaInicial/Duvidas"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <Duvidas />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      <Route
        path="/TelaInicial/Login"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <Login />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      <Route
        path="/TelaInicial/Login/Cadastro"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <CadastroLogin />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      <Route
        path="/TelaInicial/Termos"
        element={
          <AnimatedRoutes>
            <LayoutTelaInicial>
              <Termos />
            </LayoutTelaInicial>
          </AnimatedRoutes>
        }
      />

      {/* ✅ PÓS-LOGIN SEM ANIMAÇÃO */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/emitir-nota/Dados"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela1EmitirNota />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/emitir-nota/Finalizar"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela2EmitirNota />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/MeusDados"
        element={
          <ProtectedRoute>
            <Layout>
              <MeusDados />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela1Clientes />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes/cadastro"
        element={
          <ProtectedRoute>
            <Layout>
              <CadastroCliente />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes/editar/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EditarCliente />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/servicos/editar/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EditarServico />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos/editar/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EditarProduto />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela1Produtos />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos/cadastro"
        element={
          <ProtectedRoute>
            <Layout>
              <CadastroProdutos />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos/cadastro/planilha"
        element={
          <ProtectedRoute>
            <Layout>
              <CadastroProdutosPlanilha />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos/cadastro/produto"
        element={
          <ProtectedRoute>
            <Layout>
              <TelaCadastroProduto />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos/cadastro/servico"
        element={
          <ProtectedRoute>
            <Layout>
              <TelaCadastroServico />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notificacao"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela1Notificacao />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/planos"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela1Planos />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracao"
        element={
          <ProtectedRoute>
            <Layout>
              <Configuracao />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contador"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela1Contador />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sair"
        element={
          <ProtectedRoute>
            <Layout>
              <MenuSair />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/import/clientes"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela2PlanilhaClientes />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/import/produto"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela2PlanilhaProduto />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/import/servico"
        element={
          <ProtectedRoute>
            <Layout>
              <Tela2PlanilhaServico />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
