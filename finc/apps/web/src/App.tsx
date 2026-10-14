import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { PublicLayout } from "./components/PublicLayout";
import { ToastProvider } from "./components/ui";
import {
  ClienteForm,
  ClientesLista,
  ContadorForm,
  ContadoresLista,
  FornecedorForm,
  FornecedoresLista,
  ProdutoForm,
  ProdutosLista,
  ServicoForm,
  ServicosLista,
} from "./pages/app/Cadastros";
import {
  Certificado,
  ConfigAparencia,
  ConfigFiscal,
  ConfigIntegracoes,
  ConfigPreferencias,
  ConfigSeguranca,
  Configuracoes,
  MeusDados,
  Planos,
} from "./pages/app/Conta";
import {
  CompraForm,
  ComprasLista,
  OrcamentoForm,
  OrcamentosLista,
  Pdv,
  Relatorios,
} from "./pages/app/Erp";
import { NotaDetalhe, NotaForm, NotasLista } from "./pages/app/Notas";
import { Estoque, Financeiro, PedidoForm, PedidosLista } from "./pages/app/Operacoes";
import { Painel } from "./pages/app/Painel";
import {
  AdminChamados,
  ChatChamado,
  Importar,
  Notificacoes,
  NovoChamado,
  Suporte,
} from "./pages/app/Suporte";
import { Cadastro, EsqueciSenha, Login, RedefinirSenha } from "./pages/publico/Auth";
import {
  Duvidas,
  Landing,
  NotFound,
  PlanosPublico,
  QuemSomos,
  Termos,
} from "./pages/publico/Paginas";

export function Rotas() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/planos-finc" element={<PlanosPublico />} />
        <Route path="/quem-somos" element={<QuemSomos />} />
        <Route path="/duvidas" element={<Duvidas />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        {/* Rotas da FINC original redirecionadas para os novos caminhos */}
        <Route path="/TelaInicial/Login" element={<Navigate to="/login" replace />} />
        <Route path="/TelaInicial/Login/Cadastro" element={<Navigate to="/cadastro" replace />} />
        <Route path="/TelaInicial/Planos" element={<Navigate to="/planos-finc" replace />} />
        <Route path="/reset-password" element={<Navigate to="/redefinir-senha" replace />} />
      </Route>
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/app" element={<Painel />} />
        <Route path="/notas" element={<NotasLista />} />
        <Route path="/notas/nova" element={<NotaForm />} />
        <Route path="/notas/:id" element={<NotaDetalhe />} />
        <Route path="/notas/:id/editar" element={<NotaForm />} />
        <Route path="/pedidos" element={<PedidosLista />} />
        <Route path="/pedidos/novo" element={<PedidoForm />} />
        <Route path="/pedidos/:id" element={<PedidoForm />} />
        <Route path="/clientes" element={<ClientesLista />} />
        <Route path="/clientes/novo" element={<ClienteForm />} />
        <Route path="/clientes/:id" element={<ClienteForm />} />
        <Route path="/produtos" element={<ProdutosLista />} />
        <Route path="/produtos/novo" element={<ProdutoForm />} />
        <Route path="/produtos/:id" element={<ProdutoForm />} />
        <Route path="/servicos" element={<ServicosLista />} />
        <Route path="/servicos/novo" element={<ServicoForm />} />
        <Route path="/servicos/:id" element={<ServicoForm />} />
        <Route path="/contadores" element={<ContadoresLista />} />
        <Route path="/contadores/novo" element={<ContadorForm />} />
        <Route path="/contadores/:id" element={<ContadorForm />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/fornecedores" element={<FornecedoresLista />} />
        <Route path="/fornecedores/novo" element={<FornecedorForm />} />
        <Route path="/fornecedores/:id" element={<FornecedorForm />} />
        <Route path="/compras" element={<ComprasLista />} />
        <Route path="/compras/nova" element={<CompraForm />} />
        <Route path="/compras/:id" element={<CompraForm />} />
        <Route path="/orcamentos" element={<OrcamentosLista />} />
        <Route path="/orcamentos/novo" element={<OrcamentoForm />} />
        <Route path="/orcamentos/:id" element={<OrcamentoForm />} />
        <Route path="/pdv" element={<Pdv />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/importar/:entidade" element={<Importar />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/meus-dados" element={<MeusDados />} />
        <Route path="/certificado" element={<Certificado />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/configuracoes/fiscal" element={<ConfigFiscal />} />
        <Route path="/configuracoes/preferencias" element={<ConfigPreferencias />} />
        <Route path="/configuracoes/aparencia" element={<ConfigAparencia />} />
        <Route path="/configuracoes/seguranca" element={<ConfigSeguranca />} />
        <Route path="/configuracoes/integracoes" element={<ConfigIntegracoes />} />
        <Route path="/configuracoes/notificacoes" element={<Notificacoes />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/suporte" element={<Suporte />} />
        <Route path="/suporte/novo" element={<NovoChamado />} />
        <Route path="/suporte/:id" element={<ChatChamado />} />
        <Route
          path="/admin/chamados"
          element={
            <RequireAuth admin>
              <AdminChamados />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/chamados/:id"
          element={
            <RequireAuth admin>
              <ChatChamado admin />
            </RequireAuth>
          }
        />
        <Route path="/MeusDados" element={<Navigate to="/meus-dados" replace />} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Rotas />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
