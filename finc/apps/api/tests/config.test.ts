import { describe, expect, it } from "vitest";
import { ConfigError, databaseSsl, parseConfig, trustProxy } from "../src/config.js";

describe("configuração de implantação", () => {
  it("TRUST_PROXY numérico vira contagem de saltos", () => {
    expect(trustProxy(parseConfig({ TRUST_PROXY: "1" }))).toBe(1);
    expect(trustProxy(parseConfig({ TRUST_PROXY: "true" }))).toBe(true);
    expect(trustProxy(parseConfig({ TRUST_PROXY: "false" }))).toBe(false);
    expect(trustProxy(parseConfig({}))).toBe("loopback");
  });

  it("APP_URL usa RENDER_EXTERNAL_URL quando não definida", () => {
    const env = { RENDER_EXTERNAL_URL: "https://finc.onrender.com" };
    expect(parseConfig(env).APP_URL).toBe("https://finc.onrender.com");
    expect(parseConfig({ ...env, APP_URL: "https://finc.com.br" }).APP_URL).toBe(
      "https://finc.com.br",
    );
  });

  it("DATABASE_SSL monta as opções de TLS do PostgreSQL", () => {
    expect(databaseSsl(parseConfig({}))).toBeUndefined();
    expect(databaseSsl(parseConfig({ DATABASE_SSL: "false" }))).toBe(false);
    expect(databaseSsl(parseConfig({ DATABASE_SSL: "no-verify" }))).toEqual({
      rejectUnauthorized: false,
    });
    const pem = "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----";
    expect(databaseSsl(parseConfig({ DATABASE_SSL: "verify", DATABASE_SSL_CA: pem }))).toEqual({
      rejectUnauthorized: true,
      ca: pem,
    });
    expect(() => parseConfig({ DATABASE_SSL: "talvez" })).toThrow(ConfigError);
  });
});

describe("DATABASE_SCHEMA", () => {
  it("cria as tabelas no schema dedicado sem tocar nas de mesmo nome em public", async () => {
    const { createDb } = await import("../src/db/index.js");
    const { migrate } = await import("../src/db/migrate.js");
    const db = await createDb("pglite://memory", { schema: "finc" });
    try {
      // Simula o projeto antigo do Supabase: tabelas homônimas em public.
      await db.exec("CREATE TABLE public.planos (id int); CREATE TABLE public.clientes (x text)");
      const novas = await migrate(db);
      expect(novas.length).toBeGreaterThan(0);
      const { rows } = await db.query<{ table_schema: string }>(
        "SELECT table_schema FROM information_schema.tables WHERE table_name = 'usuarios'",
      );
      expect(rows.map((r) => r.table_schema)).toEqual(["finc"]);
      const antigas = await db.query("SELECT * FROM public.clientes");
      expect(antigas.rowCount).toBe(0);
    } finally {
      await db.close();
    }
  });

  it("recusa nomes de schema inválidos", () => {
    expect(() => parseConfig({ DATABASE_SCHEMA: "finc; drop" })).toThrow(ConfigError);
  });
});

describe("ADMIN_EMAILS", () => {
  it("o e-mail listado é cadastrado como administrador; os demais, como usuário", async () => {
    const { setup, registrar, gerarCpf } = await import("./helpers.js");
    const request = (await import("supertest")).default;
    const env = await setup({ ADMIN_EMAILS: " Chefe@FINC.com.br, outro@x.com " });
    try {
      const res = await request(env.app).post("/api/auth/cadastro").send({
        nome: "Chefe",
        tipo_pessoa: "FISICA",
        cpf_cnpj: gerarCpf(),
        email: "chefe@finc.com.br",
        senha: "Senha1234",
        telefone: "11988887777",
        aceite_termos: true,
      });
      expect(res.status).toBe(201);
      const comum = await registrar(env);
      const { rows } = await env.ctx.db.query<{ email: string; papel: string }>(
        "SELECT email, papel FROM usuarios WHERE email = ANY($1) ORDER BY papel",
        [["chefe@finc.com.br", comum.email]],
      );
      expect(rows.map((r) => r.papel)).toEqual(["admin", "usuario"]);
    } finally {
      await env.close();
    }
  });
});
