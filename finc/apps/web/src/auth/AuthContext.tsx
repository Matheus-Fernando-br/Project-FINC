import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, onUnauthorized, setCsrfToken } from "../api/client";
import type { Usuario } from "../api/types";
import { SplashLogin } from "../components/Splash";
import { Loading } from "../components/ui";

interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  login: (login: string, senha: string) => Promise<void>;
  cadastrar: (dados: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  recarregar: () => Promise<void>;
  /** Verdadeiro logo após um login ou cadastro bem-sucedido (nunca ao restaurar a sessão). */
  splashLogin: boolean;
  encerrarSplashLogin: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [splashLogin, setSplashLogin] = useState(false);
  const encerrarSplashLogin = useCallback(() => setSplashLogin(false), []);

  const recarregar = useCallback(async () => {
    try {
      const r = await api.get<{ usuario: Usuario; csrfToken: string }>("/auth/me");
      setCsrfToken(r.csrfToken);
      setUsuario(r.usuario);
    } catch {
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
    return onUnauthorized(() => setUsuario(null));
  }, [recarregar]);

  const login = async (login: string, senha: string) => {
    const r = await api.post<{ csrfToken: string }>("/auth/login", { login, senha });
    setCsrfToken(r.csrfToken);
    setSplashLogin(true);
    await recarregar();
  };

  const cadastrar = async (dados: Record<string, unknown>) => {
    const r = await api.post<{ csrfToken: string }>("/auth/cadastro", dados);
    setCsrfToken(r.csrfToken);
    setSplashLogin(true);
    await recarregar();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setCsrfToken("");
      setUsuario(null);
    }
  };

  return (
    <Ctx.Provider
      value={{
        usuario,
        carregando,
        login,
        cadastrar,
        logout,
        recarregar,
        splashLogin,
        encerrarSplashLogin,
      }}
    >
      {children}
      <SplashLogin ativa={splashLogin} aoTerminar={encerrarSplashLogin} />
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { usuario, carregando } = useAuth();
  const loc = useLocation();
  if (carregando) return <Loading texto="Verificando sessão..." />;
  if (!usuario)
    return (
      <Navigate to={`/login?voltar=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
    );
  if (admin && usuario.papel !== "admin") return <Navigate to="/app" replace />;
  return <>{children}</>;
}
