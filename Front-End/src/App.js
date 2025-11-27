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
import Layout from './components/Layout';
import Home from './pages/Home';
import Tela_1_emitir_nota from './pages/emitir-nota/Tela_1_emitir_nota';
import Tela_2_emitir_nota from './pages/emitir-nota/Tela_2_emitir_nota';
import MeusDados from './pages/meusDados/MeusDados';
import Tela_1_clientes from './pages/clientes/Tela_1_clientes';
import Cadastro_cliente from './pages/clientes/Cadastro_cliente';
import Tela_1_produtos from './pages/produtos_servicos/Tela_1_produtos';
import Cadastro_produtos from './pages/produtos_servicos/Cadastro_produtos';
import Tela_Cadastro_Produto from './pages/produtos_servicos/Tela_Cadastro_Produto';
import Tela_Cadastro_Servico from './pages/produtos_servicos/Tela_Cadastro_Servico';
import Tela_1_notificacao from './pages/notificacao/Tela_1_notificacao';
import Tela_1_planos from './pages/planos/Tela_1_planos';
import Pagamento from './pages/pagamento/Tela_1_Pagamento';
import Tela_1_contador from './pages/contador/Tela_1_contador';
import MenuSair from './pages/sair/MenuSair';
import ImportClientes from './pages/ImportSheet/ImportClientes';
import ImportProduto from './pages/ImportSheet/ImportProduto';
import ImportServico from './pages/ImportSheet/ImportServico';

//const importRoutes = require("./ImportSheet/importRoutes");
//app.use("/api/import", importRoutes);

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
      <Route path="/app" element={<Layout><Home /></Layout>} />
      <Route path="/emitir-nota/Dados" element={<Layout><Tela_1_emitir_nota /></Layout>} />
      <Route path="/emitir-nota/Finalizar" element={<Layout><Tela_2_emitir_nota /></Layout>} />
      <Route path="/MeusDados" element={<Layout><MeusDados /></Layout>} />
      <Route path="/clientes" element={<Layout><Tela_1_clientes /></Layout>} />
      <Route path="/clientes/cadastro" element={<Layout><Cadastro_cliente /></Layout>} />
      <Route path="/produtos" element={<Layout><Tela_1_produtos /></Layout>} />
      <Route path="/produtos/cadastro" element={<Layout><Cadastro_produtos /></Layout>} />
      <Route path="/produtos/cadastro/produto" element={<Layout><Tela_Cadastro_Produto /></Layout>} />
      <Route path="/produtos/cadastro/servico" element={<Layout><Tela_Cadastro_Servico /></Layout>} />
      <Route path="/notificacao" element={<Layout><Tela_1_notificacao /></Layout>} />
      <Route path="/planos" element={<Layout><Tela_1_planos /></Layout>} />
      <Route path="/pagamento" element={<Layout><Pagamento /></Layout>} />
      <Route path="/contador" element={<Layout><Tela_1_contador /></Layout>} />
      <Route path="/sair" element={<Layout><MenuSair /></Layout>} />
      <Route path="/import/clientes" element={<ImportClientes />} />
      <Route path="/import/produto" element={<ImportProduto />} />
      <Route path="/import/servico" element={<ImportServico />} />

    </Routes>
  );
}

export default App;