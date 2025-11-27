import React, { useState } from "react";
import axios from "axios";

export default function ImportSheetBase({ type, title }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleUpload = async () => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);

    const res = await axios.post("/api/import/preview", fd);
    setPreview(res.data.preview);
    setErrors(res.data.errors);
  };

  const confirm = async () => {
    const res = await axios.post("/api/import/confirm", {
      type,
      rows: preview.rows
    });

    alert(`${res.data.inserted} registros importados`);
  };

  return (
    <div>
      <h2>{title}</h2>

      <button onClick={() => window.location.href = `/api/import/template?type=${type}`}>
        Baixar Template
      </button>

      <input type="file" onChange={e => setFile(e.target.files[0])} />

      <button onClick={handleUpload}>Pré-visualizar</button>

      {errors.length > 0 && (
        <div>
          <h3>Erros</h3>
          {errors.map((e, i) => <p key={i}>{e.row} - {e.field} - {e.message}</p>)}
        </div>
      )}

      {preview && (
        <>
          <h3>Pré-visualização</h3>

          <table border="1">
            <thead>
              <tr>
                {preview.headers.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>

            <tbody>
              {preview.rows.map((r, i) => (
                <tr key={i}>
                  {preview.headers.map(h => <td key={h}>{r[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          <button disabled={errors.length > 0} onClick={confirm}>
            Confirmar Importação
          </button>
        </>
      )}
    </div>
  );
}
