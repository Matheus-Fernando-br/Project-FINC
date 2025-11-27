// Back-End/ImportSheet/importController.js
const { configs } = require("./importConfig");
const { readExcel, generateTemplate } = require("./utils/excel");

exports.downloadTemplate = (req, res) => {
  const type = req.query.type;
  const cfg = configs[type];
  if (!cfg) return res.status(400).json({ message: "Tipo inválido" });

  const buffer = generateTemplate(cfg.headers);
  res.setHeader("Content-Disposition", `attachment; filename=${type}_template.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats");
  return res.send(buffer);
};

function validate(type, rows) {
  const cfg = configs[type];
  const errors = [];

  rows.forEach((row, i) => {
    // required fields
    for (const [field, rule] of Object.entries(cfg.required)) {
      const val = row[field];
      let ok = typeof rule === "function" ? rule(val) : !!val;
      if (!ok) errors.push({ row: i + 2, field, message: "Obrigatório/inválido" });
    }

    // conditional fields
    if (cfg.conditional) {
      cfg.conditional.forEach(cond => {
        if (cond.when(row)) {
          const val = row[cond.field];
          if (!cond.test(val)) {
            errors.push({ row: i + 2, field: cond.field, message: "Campo condicional inválido" });
          }
        }
      });
    }
  });

  return errors;
}

exports.preview = (req, res) => {
  const { type } = req.body;
  if (!configs[type]) return res.status(400).json({ message: "Tipo inválido" });

  const rows = readExcel(req.file.buffer);
  const errors = validate(type, rows);

  return res.json({
    preview: {
      headers: configs[type].headers,
      rows: rows.slice(0, 100)
    },
    errors
  });
};

exports.confirm = async (req, res) => {
  const { type, rows } = req.body;
  if (!configs[type]) return res.status(400).json({ message: "Tipo inválido" });

  const errors = validate(type, rows);
  if (errors.length) return res.status(400).json({ message: "Validação falhou", errors });

  // TODO -> salvar no banco
  // exemplo:
  let inserted = rows.length;

  return res.json({ inserted });
};
