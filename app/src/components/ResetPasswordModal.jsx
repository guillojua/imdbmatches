import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordModal({ open, onClose }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (!open) return null;

  async function updatePassword(e) {
    e.preventDefault();
    setMsg("");

    if (p1.length < 6) return setMsg("La contraseña debe tener al menos 6 caracteres.");
    if (p1 !== p2) return setMsg("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;
      setMsg("Contraseña actualizada ✅ Ya podés usarla.");
      // cerrar a los 1.2s
      setTimeout(() => onClose?.(), 1200);
    } catch (err) {
      setMsg(err?.message || "Error actualizando contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal auth-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0, color: "#f3f6ff" }}>Nueva contraseña</h2>
            <div className="muted">Pegá tu nueva contraseña para terminar la recuperación.</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={updatePassword} className="form">
            <label>
              Nueva contraseña
              <input
                type="password"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>

            <label>
              Repetir contraseña
              <input
                type="password"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>

            <button className="btn" disabled={loading}>
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>

            {msg && <div className="msg">{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
