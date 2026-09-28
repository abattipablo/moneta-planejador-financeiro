import { useState } from "react";
import { supabase } from "../lib/supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode() {
    setIsLogin((currentMode) => !currentMode);
    setMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (!data.session) {
        setMessage("Conta criada. Confira seu e-mail para confirmar o cadastro.");
      }
    }

    setIsSubmitting(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span>PLANEJADOR PESSOAL</span>
          <h1>Moneta</h1>
          <p>
            {isLogin
              ? "Entre para acompanhar sua vida financeira."
              : "Crie sua conta para começar seu planejamento."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field" htmlFor="email">
            E-mail
            <input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="form-field" htmlFor="password">
            Senha
            <input
              autoComplete={isLogin ? "current-password" : "new-password"}
              id="password"
              minLength="8"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="No mínimo 8 caracteres"
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}

          <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Aguarde..."
              : isLogin
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
          <button onClick={changeMode} type="button">
            {isLogin ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default Auth;
