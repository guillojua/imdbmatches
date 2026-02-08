import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth({ onAuthed, onClose }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleGoogle() {
    setLoading(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // en prod podés dejarlo vacío, Supabase usa Site URL
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // El flujo continúa en el redirect de Google
    } catch (err) {
      setMsg(err?.message || "Error con Google");
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Cuenta creada. Si te pide confirmación, revisá tu email.");
        setMode("login");
      }

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthed?.(data.session);
        onClose?.();
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMsg("Listo. Te mandé un email para recuperar tu contraseña.");
      }
    } catch (err) {
      setMsg(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="auth-title">
        {mode === "login" && "Ingresar"}
        {mode === "signup" && "Crear cuenta"}
        {mode === "forgot" && "Recuperar contraseña"}
      </div>

      <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
        <span className="gdot" aria-hidden="true" />
        Continuar con Google
      </button>

      <div className="divider"><span>o</span></div>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="tu@email.com"
            required
          />
        </label>

        {mode !== "forgot" && (
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>
        )}

        <button className="btn" disabled={loading}>
          {loading
            ? "..."
            : mode === "login"
            ? "Entrar"
            : mode === "signup"
            ? "Crear cuenta"
            : "Enviar email"}
        </button>

        <div className="auth-links">
          {mode !== "signup" ? (
            <button
              type="button"
              className="link"
              onClick={() => {
                setMsg("");
                setMode("signup");
              }}
            >
              Crear cuenta
            </button>
          ) : (
            <button
              type="button"
              className="link"
              onClick={() => {
                setMsg("");
                setMode("login");
              }}
            >
              Ya tengo cuenta
            </button>
          )}

          {mode !== "forgot" ? (
            <button
              type="button"
              className="link"
              onClick={() => {
                setMsg("");
                setMode("forgot");
              }}
            >
              Olvidé mi contraseña
            </button>
          ) : (
            <button
              type="button"
              className="link"
              onClick={() => {
                setMsg("");
                setMode("login");
              }}
            >
              Volver a login
            </button>
          )}
        </div>

        {msg && <div className="msg">{msg}</div>}
      </form>
    </div>
  );
}
