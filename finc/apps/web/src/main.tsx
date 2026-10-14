import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/global.css";
import App from "./App";
import { aparencia } from "./aparencia";
import { aplicarTemposCss } from "./animacoes";

aparencia.aplicar();
aplicarTemposCss();
// O CSS do app já carregou: o fundo provisório da splash (index.html) não é mais necessário.
document.documentElement.classList.add("finc-pronto");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
