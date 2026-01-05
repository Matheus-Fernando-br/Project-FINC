import React, { useEffect } from "react";
import './styles/global.css';
import { Routes, Route } from 'react-router-dom';
//Landing Page
import HomeTelaInicial from './TelaInicial/HomeTelaInicial';
import LayoutTelaInicial from './TelaInicial/LayoutTelaInicial';
import Planos from './TelaInicial/planos/Planos';
import QuemSomos from './TelaInicial/quemSomos/QuemSomos';
import Login from './TelaInicial/login/Login';
import CadastroLogin from './TelaInicial/login/cadastro/CadastroLogin';
import Duvidas from './TelaInicial/duvidas/Duvidas';
//Pos login
import initScripts from './utils/scripts';
import Layout from './components/app/Layout';
import Home from './app/Home';
import Tela_1_emitir_nota from './app/emitir-nota/Tela_1_emitir_nota';
import Tela_2_emitir_nota from './app/emitir-nota/Tela_2_emitir_nota';
import MeusDados from './app/meusDados/MeusDados';
import Tela_1_clientes from './app/clientes/Tela_1_clientes';
import Cadastro_cliente from './app/clientes/Cadastro_cliente';
import Tela_1_produtos from './app/produtos_servicos/Tela_1';
import Cadastro_produtos from './app/produtos_servicos/Tela_2_escolha';
import Cadastro_produtos_planilha from './app/produtos_servicos/Tela_3_escolha_planilha';
import Tela_Cadastro_Produto from './app/produtos_servicos/produto/Tela_Cadastro_Produto';
import Tela_Cadastro_Servico from './app/produtos_servicos/servico/Tela_Cadastro_Servico';
import Tela_1_notificacao from './app/notificacao/Tela_1_notificacao';
import Tela_1_planos from './app/planos/Tela_1_planos';
import Pagamento from './app/pagamento/Tela_1_Pagamento';
import Tela_1_contador from './app/contador/Tela_1_contador';
import MenuSair from './app/sair/MenuSair';
import Tela_2_planilha_clientes from './app/clientes/Tela_2_planilha_clientes';
import Tela_2_planilha_produto from './app/produtos_servicos/produto/Tela_planilha_produto';
import Tela_2_planilha_servico from './app/produtos_servicos/servico/Tela_planilha_servico';
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  useEffect(() => {
    initScripts();
  }, []);

  return (
    <Routes>
      {/*Landing Page*/}
      <Route path="/" element={<LayoutTelaInicial> <HomeTelaInicial /> </LayoutTelaInicial>} />
      <Route path="/TelaInicial/Planos" element={<LayoutTelaInicial><Planos /></LayoutTelaInicial>} />
      <Route path="/TelaInicial/QuemSomos" element={<LayoutTelaInicial><QuemSomos /></LayoutTelaInicial>} />
      <Route path="/TelaInicial/Login" element={<LayoutTelaInicial><Login /></LayoutTelaInicial>} />
      <Route path="/TelaInicial/Login/Cadastro" element={<LayoutTelaInicial><CadastroLogin /></LayoutTelaInicial>} />
      <Route path="/TelaInicial/Duvidas" element={<LayoutTelaInicial><Duvidas /></LayoutTelaInicial>} />
      {/*Pos login*/}
      <Route path="/app" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
      <Route path="/emitir-nota/Dados" element={<ProtectedRoute><Layout><Tela_1_emitir_nota /></Layout></ProtectedRoute>} />
      <Route path="/emitir-nota/Finalizar" element={<ProtectedRoute><Layout><Tela_2_emitir_nota /></Layout></ProtectedRoute>} />
      <Route path="/MeusDados" element={<ProtectedRoute><Layout><MeusDados /></Layout></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Layout><Tela_1_clientes /></Layout></ProtectedRoute>} />
      <Route path="/clientes/cadastro" element={<ProtectedRoute><Layout><Cadastro_cliente /></Layout></ProtectedRoute>} />
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
  );
}

export default App;