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
