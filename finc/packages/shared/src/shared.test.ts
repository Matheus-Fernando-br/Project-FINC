import { describe, expect, it } from "vitest";
import {
  calcularTotais,
  clienteSchema,
  dentroDoLimite,
  formatCpfCnpj,
  isStrongPassword,
  isValidCNPJ,
  isValidCPF,
  produtoSchema,
  registerSchema,
  tipoItemPermitido,
  aplicarMascara,
  isValidTelefone,
  mascaraCpfCnpj,
  mascaraTelefone,
  normalizarCampos,
  normalizarTelefone,
  perfilSchema,
} from "./index.js";

describe("validadores", () => {
  it("valida CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("529.982.247-24")).toBe(false);
  });
  it("valida CNPJ", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.222.333/0001-80")).toBe(false);
    expect(isValidCNPJ("00000000000000")).toBe(false);
  });
  it("valida senha forte", () => {
    expect(isStrongPassword("abc12345")).toBe(true);
    expect(isStrongPassword("abcdefgh")).toBe(false);
    expect(isStrongPassword("1234567")).toBe(false);
  });
  it("formata documentos", () => {
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});

describe("cálculo fiscal", () => {
  it("soma impostos ao total como na FINC original", () => {
    const t = calcularTotais(
      [
        { tipo: "produto", quantidade: 2, valorUnitario: 50, icms: 18, pisCofins: 3.65 },
        { tipo: "servico", quantidade: 1, valorUnitario: 200, aliquotaIss: 5 },
      ],
      10,
      5,
    );
    expect(t.valorProdutos).toBe(100);
    expect(t.valorServicos).toBe(200);
    expect(t.valorIcms).toBe(18);
    expect(t.valorPisCofins).toBe(3.65);
    expect(t.valorIss).toBe(10);
    expect(t.totalNota).toBe(316.65);
  });
  it("pode não somar impostos (preço com tributos embutidos)", () => {
    const t = calcularTotais(
      [{ tipo: "produto", quantidade: 1, valorUnitario: 100, icms: 18 }],
      0,
      0,
      false,
    );
    expect(t.totalNota).toBe(100);
    expect(t.valorIcms).toBe(18);
  });
  it("nunca fica negativo", () => {
    expect(
      calcularTotais([{ tipo: "produto", quantidade: 1, valorUnitario: 10 }], 50).totalNota,
    ).toBe(0);
  });
  it("restringe tipos de item por tipo de nota", () => {
    expect(tipoItemPermitido("NFS-e", "servico")).toBe(true);
    expect(tipoItemPermitido("NFS-e", "produto")).toBe(false);
    expect(tipoItemPermitido("NF-e", "produto")).toBe(true);
    expect(tipoItemPermitido("NFC-e", "servico")).toBe(false);
  });
});

describe("schemas", () => {
  it("aceita cadastro válido e normaliza documento", () => {
    const r = registerSchema.parse({
      nome: "Maria MEI",
      tipo_pessoa: "FISICA",
      cpf_cnpj: "529.982.247-25",
      email: " Maria@Exemplo.com ",
      senha: "segura123",
      telefone: "(11) 98888-7777",
      aceite_termos: true,
    });
    expect(r.cpf_cnpj).toBe("52998224725");
    expect(r.email).toBe("maria@exemplo.com");
  });
  it("rejeita CNPJ inválido para pessoa jurídica", () => {
    const r = clienteSchema.safeParse({
      nome_social: "ACME",
      tipo_pessoa: "JURIDICA",
      cpf_cnpj: "52998224725",
    });
    expect(r.success).toBe(false);
  });
  it("aceita valores legados PFisica/PJuridica", () => {
    const r = clienteSchema.parse({
      nome_social: "João",
      tipo_pessoa: "PFisica",
      cpf_cnpj: "52998224725",
      email: "",
    });
    expect(r.tipo_pessoa).toBe("FISICA");
    expect(r.email).toBeNull();
  });
  it("valida NCM, CFOP e alíquotas do produto", () => {
    const base = {
      nome: "Caneta",
      categoria: "Papelaria",
      sku: "CAN-1",
      unidade_medida: "Unidade",
      preco_unitario: "2,50",
      ncm: "9608.10.00",
      cfop: "5102",
      icms: "18",
      pis_cofins: "3.65",
      origem: "0",
    };
    const ok = produtoSchema.parse(base);
    expect(ok.preco_unitario).toBe(2.5);
    expect(produtoSchema.safeParse({ ...base, icms: "180" }).success).toBe(false);
    expect(produtoSchema.safeParse({ ...base, ncm: "123" }).success).toBe(false);
  });
  it("limites de plano (null = ilimitado)", () => {
    expect(dentroDoLimite(null, 1000)).toBe(true);
    expect(dentroDoLimite(10, 9)).toBe(true);
    expect(dentroDoLimite(10, 10)).toBe(false);
  });
});

describe("máscaras e normalização", () => {
  it("formata CPF, CNPJ, CEP e telefone enquanto digita", () => {
    expect(mascaraCpfCnpj("5294")).toBe("529.4");
    expect(mascaraCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(mascaraCpfCnpj("112223330001811")).toBe("11.222.333/0001-81");
    expect(aplicarMascara("cep", "01001000")).toBe("01001-000");
    expect(mascaraTelefone("31")).toBe("(31");
    expect(mascaraTelefone("313333444")).toBe("(31) 3333-444");
    expect(mascaraTelefone("3133334444")).toBe("(31) 3333-4444");
    expect(mascaraTelefone("31999998888")).toBe("(31) 99999-8888");
    expect(mascaraTelefone("+55 31 99999-8888")).toBe("(31) 99999-8888");
    expect(aplicarMascara("email", " a b@x.com ")).toBe("ab@x.com");
  });

  it("normaliza antes de enviar à API", () => {
    expect(
      normalizarCampos(
        {
          cpf_cnpj: "529.982.247-25",
          telefone: "(31) 99999-8888",
          email: " Ana@X.COM ",
          nome: "Ana",
        },
        { cpf_cnpj: "cpfCnpj", telefone: "telefone", email: "email" },
      ),
    ).toEqual({
      cpf_cnpj: "52998224725",
      telefone: "31999998888",
      email: "ana@x.com",
      nome: "Ana",
    });
    expect(normalizarTelefone("+55 (31) 3333-4444")).toBe("3133334444");
    expect(normalizarTelefone("031 99999-8888")).toBe("31999998888");
  });

  it("valida telefones brasileiros (fixo e celular)", () => {
    expect(isValidTelefone("(31) 99999-8888")).toBe(true);
    expect(isValidTelefone("(31) 3333-4444")).toBe(true);
    expect(isValidTelefone("+55 11 98888-7777")).toBe(true);
    expect(isValidTelefone("(31) 89999-8888")).toBe(false); // celular sem o 9
    expect(isValidTelefone("(01) 3333-4444")).toBe(false); // DDD inválido
    expect(isValidTelefone("(31) 9333-4444")).toBe(false); // fixo começando com 9
    expect(isValidTelefone("123")).toBe(false);
    const r = perfilSchema.safeParse({ nome: "Ana", telefone: "+55 (31) 99999-8888" });
    expect(r.success && r.data.telefone).toBe("31999998888");
  });
});
