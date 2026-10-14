import { lazy, type ComponentType } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { PublicLayout } from "./components/PublicLayout";
import { SplashInicial } from "./components/Splash";
import { ToastProvider } from "./components/ui";
import { Cadastro, EsqueciSenha, Login, RedefinirSenha } from "./pages/publico/Auth";
import {
  Duvidas,
  Landing,
  NotFound,
  PlanosPublico,
  QuemSomos,
  Termos,
} from "./pages/publico/Paginas";

/** Telas do aplicativo carregadas sob demanda: a página inicial e o login baixam menos código. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada tela mantém as próprias props
type Tela = ComponentType<any>;
function sobDemanda<M extends Record<K, Tela>, K extends keyof M>(
  carregar: () => Promise<M>,
  nome: K,
) {
  return lazy(() => carregar().then((m) => ({ default: m[nome] })));
}

const carregarCadastros = () => import("./pages/app/Cadastros");
const ClienteForm = sobDemanda(carregarCadastros, "ClienteForm");
const ClientesLista = sobDemanda(carregarCadastros, "ClientesLista");
const ContadorForm = sobDemanda(carregarCadastros, "ContadorForm");
const ContadoresLista = sobDemanda(carregarCadastros, "ContadoresLista");
const FornecedorForm = sobDemanda(carregarCadastros, "FornecedorForm");
const FornecedoresLista = sobDemanda(carregarCadastros, "FornecedoresLista");
const ProdutoForm = sobDemanda(carregarCadastros, "ProdutoForm");
const ProdutosLista = sobDemanda(carregarCadastros, "ProdutosLista");
const ServicoForm = sobDemanda(carregarCadastros, "ServicoForm");
const ServicosLista = sobDemanda(carregarCadastros, "ServicosLista");
const carregarConta = () => import("./pages/app/Conta");
const Certificado = sobDemanda(carregarConta, "Certificado");
const ConfigAparencia = sobDemanda(carregarConta, "ConfigAparencia");
const ConfigFiscal = sobDemanda(carregarConta, "ConfigFiscal");
const ConfigIntegracoes = sobDemanda(carregarConta, "ConfigIntegracoes");
const ConfigPreferencias = sobDemanda(carregarConta, "ConfigPreferencias");
const ConfigSeguranca = sobDemanda(carregarConta, "ConfigSeguranca");
const Configuracoes = sobDemanda(carregarConta, "Configuracoes");
const MeusDados = sobDemanda(carregarConta, "MeusDados");
const Planos = sobDemanda(carregarConta, "Planos");
const carregarErp = () => import("./pages/app/Erp");
const CompraForm = sobDemanda(carregarErp, "CompraForm");
const ComprasLista = sobDemanda(carregarErp, "ComprasLista");
const OrcamentoForm = sobDemanda(carregarErp, "OrcamentoForm");
const OrcamentosLista = sobDemanda(carregarErp, "OrcamentosLista");
const Pdv = sobDemanda(carregarErp, "Pdv");
const Relatorios = sobDemanda(carregarErp, "Relatorios");
const carregarNotas = () => import("./pages/app/Notas");
const NotaDetalhe = sobDemanda(carregarNotas, "NotaDetalhe");
const NotaForm = sobDemanda(carregarNotas, "NotaForm");
const NotasLista = sobDemanda(carregarNotas, "NotasLista");
const carregarOperacoes = () => import("./pages/app/Operacoes");
const Estoque = sobDemanda(carregarOperacoes, "Estoque");
const Financeiro = sobDemanda(carregarOperacoes, "Financeiro");
const PedidoForm = sobDemanda(carregarOperacoes, "PedidoForm");
const PedidosLista = sobDemanda(carregarOperacoes, "PedidosLista");
const carregarPainel = () => import("./pages/app/Painel");
const Painel = sobDemanda(carregarPainel, "Painel");
const carregarSuporte = () => import("./pages/app/Suporte");
const AdminChamados = sobDemanda(carregarSuporte, "AdminChamados");
const ChatChamado = sobDemanda(carregarSuporte, "ChatChamado");
const Importar = sobDemanda(carregarSuporte, "Importar");
const Notificacoes = sobDemanda(carregarSuporte, "Notificacoes");
const NovoChamado = sobDemanda(carregarSuporte, "NovoChamado");
const Suporte = sobDemanda(carregarSuporte, "Suporte");

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
      <SplashInicial />
      <ToastProvider>
        <AuthProvider>
          <Rotas />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
