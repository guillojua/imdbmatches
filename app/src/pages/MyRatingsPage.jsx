import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function MyRatingsPage({ session, onNeedLogin }) {
  const userId = session?.user?.id || null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ratings")
        .select("id, match_id, rating, review, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      setRows(data || []);
      setLoading(false);
    })();
  }, [userId]);

  if (!userId) {
    return (
      <div style={{ marginTop: 14 }} className="card">
        <h2 style={{ marginTop: 0, color: "#f3f6ff" }}>Mis ratings</h2>
        <div className="muted">Tenés que iniciar sesión para ver tus calificaciones.</div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={onNeedLogin}>
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div className="page-head">
        <div className="page-title">
          <h2 style={{ margin: 0, color: "#f3f6ff" }}>Mis ratings</h2>
          <div className="muted">Tus calificaciones y reseñas.</div>
        </div>
      </div>

      {loading ? (
        <div className="muted" style={{ marginTop: 12 }}>Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="msg" style={{ marginTop: 12 }}>Todavía no calificaste ningún partido.</div>
      ) : (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="my-list">
            {rows.map((r) => (
              <button
                key={r.id}
                className="my-row"
                onClick={() => navigate(`/match/${r.match_id}`)}
              >
                <span className="pill strong">{r.rating}/10</span>
                <div className="my-main">
                  <div className="muted small">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  <div style={{ color: "#f3f6ff", fontWeight: 800 }}>
                    Ver partido
                  </div>
                  <div className="muted">{r.review || "Sin reseña."}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
