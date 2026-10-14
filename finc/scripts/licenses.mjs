// Gera docs/licencas-dependencias.md com as licenças de todas as dependências de produção instaladas.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const arvore = JSON.parse(
  execSync("npm ls --omit=dev --all --long --json", {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);
const pacotes = new Map();
function visitar(deps) {
  for (const [nome, info] of Object.entries(deps ?? {})) {
    if (info.resolved?.startsWith("file:") || nome.startsWith("@finc/")) {
      visitar(info.dependencies);
      continue;
    }
    const chave = `${nome}@${info.version}`;
    if (!pacotes.has(chave) && info.path) {
      let licenca = "DESCONHECIDA";
      try {
        const pj = JSON.parse(readFileSync(path.join(info.path, "package.json"), "utf8"));
        licenca =
          typeof pj.license === "string"
            ? pj.license
            : (pj.license?.type ?? (pj.licenses ?? []).map((l) => l.type).join(" OR ") ?? licenca);
      } catch {
        /* pacote opcional ausente */
      }
      pacotes.set(chave, { nome, versao: info.version, licenca: licenca || "DESCONHECIDA" });
    }
    visitar(info.dependencies);
  }
}
visitar(arvore.dependencies);
const lista = [...pacotes.values()].sort((a, b) => a.nome.localeCompare(b.nome));
const porLicenca = lista.reduce((m, p) => m.set(p.licenca, (m.get(p.licenca) ?? 0) + 1), new Map());
const PERMISSIVAS =
  /^(MIT|MIT-0|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|0BSD|BlueOak-1\.0\.0|Python-2\.0|CC0-1\.0|Unlicense|\(?MIT OR .*|\(?BSD-3-Clause OR GPL-2\.0\)?|\(MIT AND Zlib\)|Zlib|\(MIT OR CC0-1\.0\))$/;
const atencao = lista.filter((p) => !PERMISSIVAS.test(p.licenca));
const md = [
  "# Licenças das dependências de produção",
  "",
  `Gerado por \`npm run licenses\` em ${new Date().toISOString().slice(0, 10)} a partir de \`npm ls --omit=dev --all\`. Total: **${lista.length} pacotes**.`,
  "",
  "## Resumo por licença",
  "",
  "| Licença | Pacotes |",
  "|---|---|",
  ...[...porLicenca.entries()].sort((a, b) => b[1] - a[1]).map(([l, n]) => `| ${l} | ${n} |`),
  "",
  "## Pontos de atenção",
  "",
  atencao.length
    ? atencao.map((p) => `- \`${p.nome}@${p.versao}\`: ${p.licenca}`).join("\n")
    : "Nenhuma licença fora do conjunto permissivo (MIT, ISC, BSD, Apache-2.0 e similares).",
  "",
  "Revisão manual (2026-10-14): `png-js` traz arquivo LICENSE com texto MIT (falta apenas o campo no package.json); `chainsaw` e `victory-vendor` são variantes permissivas (MIT/X11, MIT+ISC); `buffers@0.1.1` não declara licença — é dependência transitiva antiga do `exceljs` (via `unzipper` → `binary`), usada só na leitura de .xlsx. Risco aceito e registrado; alternativa: substituir a importação .xlsx por CSV.",
  "",
  "`node-forge` é distribuído sob licença dupla (BSD-3-Clause OU GPL-2.0); a FINC o utiliza sob os termos BSD-3-Clause.",
  "",
  "## Lista completa",
  "",
  "| Pacote | Versão | Licença |",
  "|---|---|---|",
  ...lista.map((p) => `| ${p.nome} | ${p.versao} | ${p.licenca} |`),
  "",
].join("\n");
writeFileSync("docs/licencas-dependencias.md", md);
console.log(
  `docs/licencas-dependencias.md: ${lista.length} pacotes, ${atencao.length} pontos de atenção.`,
);
