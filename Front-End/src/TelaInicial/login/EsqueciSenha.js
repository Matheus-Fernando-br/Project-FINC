import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient"; // ajuste o path se necessário

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1 = digita email, 2 = confirma
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const validarEmail = (value) => {
    // validação simples
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const irParaConfirmacao = (e) => {
    e.preventDefault();
    setFeedback("");

    if (!normalizedEmail) {
      setFeedback("Informe seu e-mail.");
      return;
    }
    if (!validarEmail(normalizedEmail)) {
      setFeedback("Informe um e-mail válido.");
      return;
    }

    setStep(2);
  };

  const enviarLink = async () => {
    setLoading(true);
    setFeedback("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: "https://finc-seven.vercel.app/reset-password",
        }
      );

      if (error) throw error;

      setFeedback(
        "✅ Link enviado! Verifique sua caixa de entrada e o spam. Ao clicar, você poderá redefinir a senha."
      );
    } catch (err) {
      console.error(err);
      setFeedback(err.message || "Erro ao enviar link de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={irParaConfirmacao}>
        <h1>Recuperar senha</h1>

        {step === 1 && (
          <>
            <div className="input-box">
              <div className="label">E-mail:</div>
              <input
                type="email"
                placeholder="seuemail@dominio.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFeedback("");
                }}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <button className="btn" type="submit" disabled={loading}>
              Continuar
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ marginTop: 8 }}>
              Confirme se este é o seu e-mail:
            </p>

            <div className="input-box">
              <input type="text" value={normalizedEmail} disabled />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Voltar
              </button>

              <button
                type="button"
                className="btn"
                onClick={enviarLink}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </div>
          </>
        )}

        {feedback && <p className="feedback">{feedback}</p>}

        <div style={{ marginTop: 12 }}>
          <Link to="/TelaInicial/Login">Voltar ao login</Link>
        </div>
      </form>
    </div>
  );
}