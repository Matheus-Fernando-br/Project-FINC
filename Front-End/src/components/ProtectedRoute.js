import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await apiFetch("/auth/me", {
          method: "GET",
          skipLogoutOn401: true,
        });
        if (!cancelled) setStatus("ok");
      } catch {
        if (!cancelled) setStatus("unauth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Verificando sessão...
      </div>
    );
  }

  if (status === "unauth") {
    return <Navigate to="/TelaInicial/Login" replace />;
  }

  return children;
}
