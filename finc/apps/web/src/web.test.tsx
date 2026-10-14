import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, setCsrfToken } from "./api/client";
import { AuthProvider } from "./auth/AuthContext";
import { Field, ToastProvider } from "./components/ui";
import { configurarExibicao, dataBR, numeroNota } from "./format";
import { Rotas } from "./App";

afterEach(() => vi.restoreAllMocks());

function respostaJson(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("componentes", () => {
  it("Field associa rótulo ao controle automaticamente e mostra erro", () => {
    render(
      <Field label="Nome" required error="Obrigatório">
        <input />
      </Field>,
    );
    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Obrigatório");
  });
});

describe("formatação", () => {
  it("formata datas sem deslocar o fuso e respeita a preferência", () => {
    expect(dataBR("2026-01-05")).toBe("05/01/2026");
    configurarExibicao("yyyy-MM-dd");
    expect(dataBR("2026-01-05")).toBe("2026-01-05");
    configurarExibicao("dd/MM/yyyy");
    expect(numeroNota(12)).toBe("000000012");
    expect(numeroNota(null)).toBe("Rascunho");
  });
});

describe("cliente da API", () => {
  it("envia o token CSRF em métodos de escrita e converte erros", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respostaJson(400, {
        error: {
          code: "VALIDACAO",
          message: "Dados inválidos",
          details: [{ campo: "email", mensagem: "E-mail inválido" }],
        },
      }),
    );
    setCsrfToken("tok123");
    const err = await api.post("/clientes", { a: 1 }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).campos).toEqual({ email: "E-mail inválido" });
    const init = spy.mock.calls[0]![1]!;
    expect((init.headers as Record<string, string>)["X-CSRF-Token"]).toBe("tok123");
    expect(init.credentials).toBe("include");
  });
});

describe("rotas", () => {
  it("redireciona rota privada para o login quando não há sessão", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      respostaJson(401, { error: { code: "NAO_AUTENTICADO", message: "Não autenticado." } }),
    );
    render(
      <MemoryRouter initialEntries={["/financeiro"]}>
        <ToastProvider>
          <AuthProvider>
            <Rotas />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Entrar na FINC" })).toBeInTheDocument();
  });

  it("login exibe a mensagem genérica da API", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/auth/login")
        ? respostaJson(401, {
            error: { code: "CREDENCIAIS_INVALIDAS", message: "Usuário ou senha inválidos." },
          })
        : respostaJson(401, { error: { code: "NAO_AUTENTICADO", message: "x" } }),
    );
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <ToastProvider>
          <AuthProvider>
            <Rotas />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    );
    await userEvent.type(await screen.findByLabelText(/E-mail ou CPF/), "a@b.com");
    await userEvent.type(screen.getByLabelText(/^Senha/), "x");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() =>
      expect(screen.getByText("Usuário ou senha inválidos.")).toBeInTheDocument(),
    );
  });
});
