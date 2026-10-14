import { randomBytes } from "node:crypto";
import pg from "pg";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";
import { buildContext } from "../src/bootstrap.js";
import type { AppContext } from "../src/context.js";
import type { EmailMessage, Mailer } from "../src/services/email.js";
import type { Telegram } from "../src/services/telegram.js";

export interface TestEnv {
  app: Express;
  ctx: AppContext;
  emails: EmailMessage[];
  telegramMsgs: string[];
  close: () => Promise<void>;
}

export const CERT_KEY = Buffer.alloc(32, 7).toString("base64");

export async function setup(
  extraEnv: Record<string, string> = {},
  opts: { smtp?: boolean } = {},
): Promise<TestEnv> {
  const emails: EmailMessage[] = [];
  const telegramMsgs: string[] = [];
  const mailer: Mailer = {
    enabled: opts.smtp ?? true,
    async send(m) {
      emails.push(m);
    },
  };
  const telegram: Telegram = {
    enabled: true,
    async sendMessage(t) {
      telegramMsgs.push(t);
    },
    async editKeyboard() {},
    async answerCallback() {},
  };
  const fakeFetch = (async (url: string) => {
    if (String(url).includes("01001000")) {
      return new Response(
        JSON.stringify({
          uf: "SP",
          localidade: "São Paulo",
          logradouro: "Praça da Sé",
          bairro: "Sé",
          complemento: "lado ímpar",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ erro: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  // TEST_DATABASE_URL=postgres://... executa a suíte contra um PostgreSQL real (um banco novo por arquivo de teste).
  const { url, drop } = await bancoDeTeste();
  const ctx = await buildContext(
    {
      NODE_ENV: "test",
      DATABASE_URL: url,
      LOG_LEVEL: "silent",
      RATE_LIMIT_DESATIVADO: "true",
      SESSION_SECRET: "x".repeat(40),
      CERT_ENCRYPTION_KEY: CERT_KEY,
      TELEGRAM_BOT_TOKEN: "123:abc",
      TELEGRAM_CHAT_ID: "999",
      TELEGRAM_WEBHOOK_SECRET: "segredo-webhook",
      ...extraEnv,
    },
    { mailer, telegram, fetchImpl: fakeFetch },
  );
  const app = createApp(ctx);
  return {
    app,
    ctx,
    emails,
    telegramMsgs,
    close: async () => {
      await ctx.db.close();
      await drop();
    },
  };
}

async function bancoDeTeste(): Promise<{ url: string; drop: () => Promise<void> }> {
  const base = process.env.TEST_DATABASE_URL;
  if (!base) return { url: "pglite://memory", drop: async () => {} };
  const nome = `finc_test_${randomBytes(6).toString("hex")}`;
  const admin = new pg.Client({ connectionString: base });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${nome}`);
  await admin.end();
  const u = new URL(base);
  u.pathname = `/${nome}`;
  return {
    url: u.toString(),
    drop: async () => {
      const c = new pg.Client({ connectionString: base });
      await c.connect();
      await c.query(`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
      await c.end();
    },
  };
}

let seq = 0;

/** Gera CPFs válidos determinísticos para os testes. */
export function gerarCpf(): string {
  seq++;
  const base = String(100000000 + seq * 7919)
    .slice(-9)
    .split("")
    .map(Number);
  const dv = (nums: number[]) => {
    const soma = nums.reduce((s, n, i) => s + n * (nums.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  const d2 = dv([...base, d1]);
  return [...base, d1, d2].join("");
}

export interface Usuario {
  agent: ReturnType<typeof request.agent>;
  csrf: string;
  email: string;
  cpf: string;
  senha: string;
}

export async function registrar(env: TestEnv, nome = "Empresa Teste"): Promise<Usuario> {
  const cpf = gerarCpf();
  const email = `u${cpf}@teste.com.br`;
  const senha = "Senha1234";
  const agent = request.agent(env.app);
  const res = await agent.post("/api/auth/cadastro").send({
    nome,
    tipo_pessoa: "FISICA",
    cpf_cnpj: cpf,
    email,
    senha,
    telefone: "11988887777",
    aceite_termos: true,
  });
  if (res.status !== 201)
    throw new Error(`cadastro falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, csrf: res.body.csrfToken, email, cpf, senha };
}

/** Helpers que incluem o header CSRF automaticamente. */
export const api = (u: Usuario) => ({
  get: (p: string) => u.agent.get(`/api${p}`),
  post: (p: string, body?: unknown) =>
    u.agent
      .post(`/api${p}`)
      .set("X-CSRF-Token", u.csrf)
      .send(body as object),
  put: (p: string, body?: unknown) =>
    u.agent
      .put(`/api${p}`)
      .set("X-CSRF-Token", u.csrf)
      .send(body as object),
  del: (p: string) => u.agent.delete(`/api${p}`).set("X-CSRF-Token", u.csrf),
});

export const ENDERECO = {
  cep: "01001000",
  uf: "SP",
  cidade: "São Paulo",
  logradouro: "Praça da Sé",
  bairro: "Sé",
  numero: "100",
};

export const PRODUTO = {
  nome: "Caneta Azul",
  fabricante: "BIC",
  categoria: "Papelaria",
  sku: "CAN-001",
  unidade_medida: "Unidade",
  preco_unitario: 10,
  ncm: "96081000",
  cfop: "5102",
  icms: 18,
  pis_cofins: 3.65,
  origem: "0",
};

export const SERVICO = {
  nome: "Consultoria",
  categoria: "Consultoria",
  codigo_interno: "SRV-1",
  preco: 200,
  unidade_medida: "Hora",
  cnae: "7020400",
  codigo_servico: "17.01",
  aliquota_iss: 5,
};

export const CLIENTE = {
  nome_social: "Cliente Alfa LTDA",
  tipo_pessoa: "JURIDICA",
  cpf_cnpj: "11222333000181",
  email: "alfa@cliente.com",
  ...ENDERECO,
};
