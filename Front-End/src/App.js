import React from "react";
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
import Tela_1_emitir_nota from "./app/emitir-nota/tela1EmitirNota";
import Tela_2_emitir_nota from "./app/emitir-nota/tela2EmitirNota";
import MeusDados from "./app/meusDados/MeusDados";
import Tela_1_clientes from "./app/clientes/tela1Clientes";
import Cadastro_cliente from "./app/clientes/cadastroCliente";
import Editar_cliente from "./app/clientes/editarCliente";
import Tela_1_produtos from "./app/produtos_servicos/tela1";
import Cadastro_produtos from "./app/produtos_servicos/tela2Escolha";
import Cadastro_produtos_planilha from "./app/produtos_servicos/tela3EscolhaPlanilha";
import Tela_Cadastro_Produto from "./app/produtos_servicos/produto/telaCadastroProduto";
import Tela_Cadastro_Servico from "./app/produtos_servicos/servico/telaCadastroServico";
import Tela_1_notificacao from "./app/notificacao/tela1Notificacao";
import Tela_1_planos from "./app/planos/tela1Planos";
import Pagamento from "./app/pagamento/tela1Pagamento";
import Tela_1_contador from "./app/contador/tela1Contador";
import MenuSair from "./app/sair/menuSair";
import Tela_2_planilha_clientes from "./app/clientes/tela2PlanilhaClientes";
import Tela_2_planilha_produto from "./app/produtos_servicos/produto/telaPlanilhaProduto";
import Tela_2_planilha_servico from "./app/produtos_servicos/servico/telaPlanilhaServico";

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* 🔥 PRÉ-LOGIN COM ANIMAÇÃO */}
      <AnimatedRoutes>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <LayoutTelaInicial>
                <HomeTelaInicial />
              </LayoutTelaInicial>
            }
          />
          <Route
            path="/TelaInicial/Planos"
            element={<LayoutTelaInicial><Planos /></LayoutTelaInicial>}
          />
          <Route
            path="/TelaInicial/QuemSomos"
            element={<LayoutTelaInicial><QuemSomos /></LayoutTelaInicial>}
          />
          <Route
            path="/TelaInicial/Duvidas"
            element={<LayoutTelaInicial><Duvidas /></LayoutTelaInicial>}
          />
          <Route
            path="/TelaInicial/Login"
            element={<LayoutTelaInicial><Login /></LayoutTelaInicial>}
          />
          <Route
            path="/TelaInicial/Login/Cadastro"
            element={<LayoutTelaInicial><CadastroLogin /></LayoutTelaInicial>}
          />
          <Route
            path="/TelaInicial/Termos"
            element={<LayoutTelaInicial><Termos /></LayoutTelaInicial>}
          />
        </Routes>
      </AnimatedRoutes>

      {/* ✅ PÓS-LOGIN SEM ANIMAÇÃO */}
      <Routes>
        <Route path="/app" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
        <Route path="/emitir-nota/Dados" element={<ProtectedRoute><Layout><Tela_1_emitir_nota /></Layout></ProtectedRoute>} />
        <Route path="/emitir-nota/Finalizar" element={<ProtectedRoute><Layout><Tela_2_emitir_nota /></Layout></ProtectedRoute>} />
        <Route path="/MeusDados" element={<ProtectedRoute><Layout><MeusDados /></Layout></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Layout><Tela_1_clientes /></Layout></ProtectedRoute>} />
        <Route path="/clientes/cadastro" element={<ProtectedRoute><Layout><Cadastro_cliente /></Layout></ProtectedRoute>} />
        <Route path="/clientes/editar/:id" element={<ProtectedRoute><Layout><Editar_cliente /></Layout></ProtectedRoute>} />
        <Route path="/produtos" element={<ProtectedRoute><Layout><Tela_1_produtos /></Layout></ProtectedRoute>} />
        <Route path="/produtos/cadastro" element={<ProtectedRoute><Layout><Cadastro_produtos /></Layout></ProtectedRoute>} />
        <Route path="/produtos/cadastro/planilha" element={<ProtectedRoute><Layout><Cadastro_produtos_planilha /></Layout></ProtectedRoute>} />
        <Route path="/produtos/cadastro/produto" element={<ProtectedRoute><Layout><Tela_Cadastro_Produto /></Layout></ProtectedRoute>} />
        <Route path="/produtos/cadastro/servico" element={<ProtectedRoute><Layout><Tela_Cadastro_Servico /></Layout></ProtectedRoute>} />
        <Route path="/notificacao" element={<ProtectedRoute><Layout><Tela_1_notificacao /></Layout></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><Layout><Tela_1_planos /></Layout></ProtectedRoute>} />
        <Route path="/pagamento" element={<ProtectedRoute><Layout><Pagamento /></Layout></ProtectedRoute>} />
        <Route path="/contador" element={<ProtectedRoute><Layout><Tela_1_contador /></Layout></ProtectedRoute>} />
        <Route path="/sair" element={<ProtectedRoute><Layout><MenuSair /></Layout></ProtectedRoute>} />
        <Route path="/import/clientes" element={<ProtectedRoute><Layout><Tela_2_planilha_clientes /></Layout></ProtectedRoute>} />
        <Route path="/import/produto" element={<ProtectedRoute><Layout><Tela_2_planilha_produto /></Layout></ProtectedRoute>} />
        <Route path="/import/servico" element={<ProtectedRoute><Layout><Tela_2_planilha_servico /></Layout></ProtectedRoute>} />
      </Routes>
    </>
  );
}