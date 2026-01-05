export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    localStorage.clear();
    return <Navigate to="/TelaInicial/Login" replace />;
  }

  return children;
}
