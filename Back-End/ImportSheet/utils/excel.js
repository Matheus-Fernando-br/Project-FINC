// Back-End/ImportSheet/utils/excel.js
const xlsx = require("xlsx");

function readExcel(buffer) {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: null });
}

function generateTemplate(headers) {
  const ws = xlsx.utils.json_to_sheet([Object.fromEntries(headers.map(h => [h, ""]))]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Template");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

module.exports = { readExcel, generateTemplate };
