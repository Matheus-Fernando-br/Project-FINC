/** CSV no padrão brasileiro (separador ";", BOM UTF-8 para abrir corretamente no Excel). */

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s =
    v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutraliza injeção de fórmulas em planilhas (CSV injection).
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(
  rows: Record<string, unknown>[],
  cols: { coluna: string; titulo: string }[],
): string {
  const header = cols.map((c) => cell(c.titulo)).join(";");
  const body = rows.map((r) => cols.map((c) => cell(r[c.coluna])).join(";"));
  return "\uFEFF" + [header, ...body].join("\r\n") + "\r\n";
}

/** Parser CSV com suporte a aspas, separador ";" ou "," (detectado pelo cabeçalho). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep =
    (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
