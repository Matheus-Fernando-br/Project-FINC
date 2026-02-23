import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient"; // ajuste o path se necessário

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1 = digita email, 2 = confirma
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

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
      setTimeout(() => {
        navigate("/TelaInicial/Login");
      }, 3000);
    } catch (err) {
      console.error(err);
      setFeedback(err.message || "Erro ao enviar link de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="Login">
        <div className="Fundo">
          <img src="/Images/Fundo-Login-teste.png" alt="Fundo" />
        </div>

        <div className="rodape form-footer voltar">
          <Link to="/TelaInicial/Login">
            Voltar para Tela de Login{" "}
            <i className="bi bi-chevron-double-left"></i>
            <i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>

        <div className="wrapper">
          <form onSubmit={irParaConfirmacao}>
            <h1>Recuperar senha</h1>

            {step === 1 && (
              <>
                <div className="input-box">
                  <div className="label">E-mail:</div>
                  <input
                    type="email"
                    placeholder="Informe seu e-mail"
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

            {feedback && <p className="feedback" style={{marginTop:15}}>{feedback}</p>}

          </form>
        </div>
      </section>
    </main>
  );
}