import { Navigate } from "react-router-dom";

function getToken() {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

export default function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token || token === "undefined" || token === "null") {
    // limpa apenas o necessário
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    return <Navigate to="/TelaInicial/Login" replace />;
  }

  return children;
}