import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient"; // ajuste o path se necessário

export default function ResetPassword() {
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Se o Supabase conseguir processar a URL, ele cria uma sessão temporária
    // para permitir updateUser({password}).
    const check = async () => {
      setFeedback("");

      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        setFeedback(
          "Link inválido ou expirado. Solicite a recuperação novamente.",
        );
      }
      setReady(true);
    };

    check();
  }, []);

  const validarSenha = (s) => s.length >= 6;

  const trocarSenha = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!validarSenha(novaSenha)) {
      setFeedback("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setFeedback("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) throw error;

      // opcional: encerra sessão do recovery
      await supabase.auth.signOut();

      setFeedback("✅ Senha atualizada. Você já pode fazer login.");
      setTimeout(() => navigate("/TelaInicial/Login"), 800);
    } catch (err) {
      console.error(err);
      setFeedback(err.message || "Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="wrapper">
      <form onSubmit={trocarSenha}>
        <h1>Nova senha</h1>

        {feedback && <p className="feedback">{feedback}</p>}

        <div className="input-box">
          <div className="label">Nova senha:</div>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <div className="input-box">
          <div className="label">Confirmar senha:</div>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>

        <div style={{ marginTop: 12 }}>
          <Link to="/TelaInicial/Login">Voltar ao login</Link>
        </div>
      </form>
    </div>
  );
}
