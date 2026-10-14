import { Router } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import forge from "node-forge";
import { onlyDigits } from "@finc/shared";
import type { AppContext } from "../context.js";
import { AppError, zodDetails } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { decrypt, encrypt } from "../security/tokens.js";
import { audit } from "../services/audit.js";
import { parseCsv, toCsv } from "../services/csv.js";
import { assertLimite } from "../services/planos.js";
import { clientesDef, produtosDef, servicosDef } from "./cadastros.js";
import { inserir, type CrudDef } from "./crud.js";

const upload = (maxBytes: number) =>
  multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1 } });

/* ======================= Certificado digital A1 ======================= */

export interface InfoCertificado {
  titular: string | null;
  documento: string | null;
  emissor: string | null;
  numero_serie: string;
  valido_de: Date;
  valido_ate: Date;
}

/** Abre um PKCS#12 (.pfx/.p12) com a senha e extrai os dados do certificado do titular. */
export function lerCertificado(arquivo: Buffer, senha: string): InfoCertificado {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(arquivo.toString("binary")));
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, senha);
  } catch {
    throw new AppError(
      "VALIDACAO",
      "Não foi possível abrir o certificado: arquivo inválido ou senha incorreta.",
    );
  }
  const certOid = forge.pki.oids.certBag!;
  const keyOid = forge.pki.oids.pkcs8ShroudedKeyBag!;
  const bags: forge.pkcs12.Bag[] = p12.getBags({ bagType: certOid })[certOid] ?? [];
  const keyBags: forge.pkcs12.Bag[] = p12.getBags({ bagType: keyOid })[keyOid] ?? [];
  if (!keyBags.length)
    throw new AppError(
      "VALIDACAO",
      "O arquivo não contém a chave privada (certificado A1 completo é necessário).",
    );
  // Prefere o certificado de entidade final (não-CA).
  const certs = bags.map((b) => b.cert).filter((c): c is forge.pki.Certificate => Boolean(c));
  const cert =
    certs.find((c) => !(c.getExtension("basicConstraints") as { cA?: boolean } | null)?.cA) ??
    certs[0];
  if (!cert) throw new AppError("VALIDACAO", "Nenhum certificado encontrado no arquivo.");
  const cn = (cert.subject.getField("CN")?.value as string | undefined) ?? null;
  // Certificados ICP-Brasil usam "NOME:CNPJ/CPF" no CN.
  const doc = cn?.match(/:(\d{11}|\d{14})\s*$/)?.[1] ?? null;
  return {
    titular: cn ? cn.replace(/:\d{11,14}\s*$/, "") : null,
    documento: doc,
    emissor: (cert.issuer.getField("CN")?.value as string | undefined) ?? null,
    numero_serie: cert.serialNumber,
    valido_de: cert.validity.notBefore,
    valido_ate: cert.validity.notAfter,
  };
}

export function certificadoRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;
  const chave = () => {
    if (!ctx.cfg.CERT_ENCRYPTION_KEY) {
      throw new AppError(
        "INTEGRACAO_NAO_CONFIGURADA",
        "Armazenamento de certificados desativado: defina CERT_ENCRYPTION_KEY no servidor.",
      );
    }
    return ctx.cfg.CERT_ENCRYPTION_KEY;
  };

  r.get("/", async (req, res) => {
    const { rows } = await db.query(
      "SELECT nome_arquivo, titular, documento, emissor, numero_serie, valido_de, valido_ate, criado_em FROM certificados WHERE usuario_id = $1",
      [uid(req)],
    );
    const c = rows[0] as { valido_ate: Date } | undefined;
    res.json({
      habilitado: Boolean(ctx.cfg.CERT_ENCRYPTION_KEY),
      certificado: c
        ? {
            ...c,
            expirado: new Date(c.valido_ate) < new Date(),
            dias_restantes: Math.floor((new Date(c.valido_ate).getTime() - Date.now()) / 86400000),
          }
        : null,
    });
  });

  r.post("/", upload(64 * 1024).single("arquivo"), async (req, res) => {
    const key = chave();
    const file = req.file;
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
    if (!file)
      throw new AppError("VALIDACAO", "Selecione o arquivo do certificado (.pfx ou .p12).");
    if (!/\.(pfx|p12)$/i.test(file.originalname))
      throw new AppError("VALIDACAO", "Formato inválido: envie um arquivo .pfx ou .p12.");
    if (!senha) throw new AppError("VALIDACAO", "Informe a senha do certificado.");
    const info = lerCertificado(file.buffer, senha);
    if (info.valido_ate < new Date())
      throw new AppError(
        "REGRA_NEGOCIO",
        `Certificado expirado em ${info.valido_ate.toLocaleDateString("pt-BR")}.`,
      );
    const { rows } = await db.query<{ cpf_cnpj: string }>(
      "SELECT cpf_cnpj FROM usuarios WHERE id = $1",
      [uid(req)],
    );
    if (info.documento && rows[0] && info.documento !== rows[0].cpf_cnpj) {
      throw new AppError(
        "REGRA_NEGOCIO",
        "O CPF/CNPJ do certificado não corresponde ao da sua conta.",
      );
    }
    await db.query(
      `INSERT INTO certificados (usuario_id, nome_arquivo, titular, documento, emissor, numero_serie, valido_de, valido_ate, arquivo_cifrado, senha_cifrada)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (usuario_id) DO UPDATE SET nome_arquivo=EXCLUDED.nome_arquivo, titular=EXCLUDED.titular, documento=EXCLUDED.documento,
         emissor=EXCLUDED.emissor, numero_serie=EXCLUDED.numero_serie, valido_de=EXCLUDED.valido_de, valido_ate=EXCLUDED.valido_ate,
         arquivo_cifrado=EXCLUDED.arquivo_cifrado, senha_cifrada=EXCLUDED.senha_cifrada, criado_em=now()`,
      [
        uid(req),
        file.originalname.slice(0, 200),
        info.titular,
        info.documento,
        info.emissor,
        info.numero_serie,
        info.valido_de,
        info.valido_ate,
        encrypt(key, file.buffer),
        encrypt(key, Buffer.from(senha, "utf8")),
      ],
    );
    await audit(db, req, uid(req), "certificado.enviar", "certificados", uid(req), {
      numero_serie: info.numero_serie,
    });
    res.status(201).json({ ok: true, certificado: info });
  });

  /** Revalida o certificado armazenado (garante que a cifragem e a senha continuam íntegras). */
  r.post("/validar", async (req, res) => {
    const key = chave();
    const { rows } = await db.query<{ arquivo_cifrado: string; senha_cifrada: string }>(
      "SELECT arquivo_cifrado, senha_cifrada FROM certificados WHERE usuario_id = $1",
      [uid(req)],
    );
    if (!rows[0]) throw new AppError("NAO_ENCONTRADO", "Nenhum certificado cadastrado.");
    const info = lerCertificado(
      decrypt(key, rows[0].arquivo_cifrado),
      decrypt(key, rows[0].senha_cifrada).toString("utf8"),
    );
    res.json({ ok: true, certificado: info, expirado: info.valido_ate < new Date() });
  });

  r.delete("/", async (req, res) => {
    await db.query("DELETE FROM certificados WHERE usuario_id = $1", [uid(req)]);
    await audit(db, req, uid(req), "certificado.remover", "certificados", uid(req));
    res.json({ ok: true });
  });
  return r;
}

/* ======================= Importação de planilhas ======================= */

const DEFS: Record<string, CrudDef> = {
  clientes: clientesDef,
  produtos: produtosDef,
  servicos: servicosDef,
};

/** Aliases de cabeçalho aceitos (inclui nomes usados nos modelos da FINC original). */
const ALIASES: Record<string, string> = {
  nome: "nome",
  "nome social": "nome_social",
  nome_social: "nome_social",
  cliente: "nome_social",
  "cpf/cnpj": "cpf_cnpj",
  cpf_cnpj: "cpf_cnpj",
  cpf: "cpf_cnpj",
  cnpj: "cpf_cnpj",
  documento: "cpf_cnpj",
  "tipo pessoa": "tipo_pessoa",
  tipo_pessoa: "tipo_pessoa",
  tipo: "tipo_pessoa",
  "e-mail": "email",
  email: "email",
  telefone: "telefone",
  whatsapp: "whatsapp",
  preco: "preco_unitario",
  preço: "preco_unitario",
  "preço unitário": "preco_unitario",
  "unidade de medida": "unidade_medida",
  unidade: "unidade_medida",
  cofins: "pis_cofins",
  "pis/cofins": "pis_cofins",
  "código interno": "codigo_interno",
  "codigo interno": "codigo_interno",
  "código do serviço": "codigo_servico",
  "alíquota iss": "aliquota_iss",
  iss: "aliquota_iss",
  descrição: "descricao",
  // Cabeçalhos dos modelos .xlsx da FINC original
  tipopessoa: "tipo_pessoa",
  rua: "logradouro",
  category: "categoria",
  unittype: "unidade_medida",
  productorigin: "origem",
};

function normalizarCabecalho(h: string, def: CrudDef): string {
  const k = h.trim().toLowerCase();
  const alvo = ALIASES[k] ?? k.replace(/\s+/g, "_");
  if (def.tabela === "clientes" && alvo === "nome") return "nome_social";
  if (def.tabela === "servicos" && alvo === "preco_unitario") return "preco";
  if (def.tabela === "servicos" && alvo === "descricao") return "descricao_detalhada";
  return alvo;
}

async function lerPlanilha(buffer: Buffer, nome: string): Promise<string[][]> {
  if (/\.csv$/i.test(nome)) return parseCsv(buffer.toString("utf8"));
  if (!/\.xlsx$/i.test(nome))
    throw new AppError("VALIDACAO", "Formato não suportado: envie .xlsx ou .csv.");
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    throw new AppError("VALIDACAO", "Planilha inválida ou corrompida.");
  }
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const linhas: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const vals = (row.values as unknown[]).slice(1).map((v) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "object" && v !== null && "text" in v)
        return String((v as { text: unknown }).text);
      if (typeof v === "object" && v !== null && "result" in v)
        return String((v as { result: unknown }).result ?? "");
      return String(v);
    });
    linhas.push(vals);
  });
  return linhas;
}

export function importacaoRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/:entidade/modelo.csv", (req, res) => {
    const def = DEFS[String(req.params.entidade)];
    if (!def) throw new AppError("NAO_ENCONTRADO", "Entidade de importação inválida.");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="modelo-${def.tabela}.csv"`);
    res.send(
      toCsv(
        [],
        def.csv.filter((c) => def.colunas.includes(c.coluna)),
      ),
    );
  });

  /**
   * Importa linhas válidas e devolve um relatório linha a linha (o que entrou, o que foi rejeitado e por quê),
   * no espírito do modelo de "evidências e limitações" do REA: nada é descartado em silêncio.
   */
  r.post("/:entidade", upload(5 * 1024 * 1024).single("arquivo"), async (req, res) => {
    const def = DEFS[String(req.params.entidade)];
    if (!def) throw new AppError("NAO_ENCONTRADO", "Entidade de importação inválida.");
    if (!req.file) throw new AppError("VALIDACAO", "Selecione um arquivo .xlsx ou .csv.");
    const linhas = await lerPlanilha(req.file.buffer, req.file.originalname);
    if (linhas.length < 2)
      throw new AppError("VALIDACAO", "A planilha precisa ter um cabeçalho e ao menos uma linha.");
    if (linhas.length > 2001)
      throw new AppError("VALIDACAO", "Limite de 2000 linhas por importação.");
    const cab = linhas[0]!.map((h) => normalizarCabecalho(h, def));
    const desconhecidas = cab.filter(
      (c) => c && !def.colunas.includes(c) && c !== "estoque_inicial",
    );

    const validos: { linha: number; dados: Record<string, unknown> }[] = [];
    const erros: { linha: number; erros: { campo: string; mensagem: string }[] }[] = [];
    linhas.slice(1).forEach((cols, i) => {
      const obj: Record<string, unknown> = {};
      cab.forEach((c, j) => {
        const v = (cols[j] ?? "").trim();
        if (!c || v === "") return;
        if (c === "controla_estoque" || c === "ativo")
          obj[c] = ["1", "sim", "true", "s", "x"].includes(v.toLowerCase());
        else if (c === "cpf_cnpj" && /^\d{9,13}$/.test(v))
          obj[c] = v.padStart(v.length <= 11 ? 11 : 14, "0"); // zeros perdidos no Excel
        else obj[c] = v;
      });
      if (def.tabela === "produtos" && obj.origem !== undefined)
        obj.origem = onlyDigits(obj.origem).slice(0, 1);
      const parsed = def.schema.safeParse(obj);
      if (parsed.success)
        validos.push({ linha: i + 2, dados: parsed.data as Record<string, unknown> });
      else erros.push({ linha: i + 2, erros: zodDetails(parsed.error) });
    });

    const inseridos: number[] = [];
    await db.tx(async (q) => {
      if (def.recurso && validos.length)
        await assertLimite(q, uid(req), def.recurso, validos.length);
      for (const v of validos) {
        // Savepoint por linha: duplicidades são reportadas sem abortar a importação inteira.
        await q.query("SAVEPOINT linha");
        try {
          await inserir(q, def, uid(req), v.dados);
          await q.query("RELEASE SAVEPOINT linha");
          inseridos.push(v.linha);
        } catch (err) {
          await q.query("ROLLBACK TO SAVEPOINT linha");
          const dup = (err as { code?: string }).code === "23505";
          erros.push({
            linha: v.linha,
            erros: [
              {
                campo: "",
                mensagem: dup
                  ? "Registro duplicado (já existe)."
                  : "Registro rejeitado pelo banco de dados.",
              },
            ],
          });
        }
      }
      await audit(q, req, uid(req), `${def.tabela}.importar`, def.tabela, null, {
        importados: inseridos.length,
        rejeitados: erros.length,
      });
    });
    erros.sort((a, b) => a.linha - b.linha);
    res.json({
      total: linhas.length - 1,
      importados: inseridos.length,
      rejeitados: erros.length,
      erros,
      colunasIgnoradas: desconhecidas,
    });
  });
  return r;
}
