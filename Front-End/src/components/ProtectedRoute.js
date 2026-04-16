import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchSessionWithRetry } from "../utils/api.js";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchSessionWithRetry(2, 100);
        if (!cancelled) setStatus("ok");
      } catch {
        if (!cancelled) setStatus("unauth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔥 NÃO mostra nada (silencioso)
  if (status === "checking") return null;

  if (status === "unauth") {
    return <Navigate to="/TelaInicial/Login" replace />;
  }

  return children;
}