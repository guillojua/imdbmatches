import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function prettyScore(score) {
  if (!score) return "TBD";
  const s = String(score).toLowerCase();
  if (s.includes("null")) return "TBD";
  if (s.trim() === "-" || s.trim() === "vs") return "TBD";
  return score;
}

export default function MatchPage({ session, onNeedLogin }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = session?.user?.id || null;

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myRatingRow, setMyRatingRow] = useState(null);
  const [rating, setRating] = useState(8);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);

  const [recent, setRecent] = useState([]);

  const title = useMemo(() => {
    if (!match) return "Partido";
    return `${match.home} vs ${match.away}`;
  }, [match]);

  const isFinished = match?.status === "FINISHED";

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  async function loadAll() {
    setLoading(true);

    const { data: m, error: em } = await supabase
      .from("matches_with_stats")
      .select("*")
      .eq("id", id)
      .single();

    if (em) console.error(em);
    setMatch(m || null);

    const { data: recents } = await supabase
      .from("ratings")
      .select("id, rating, review, created_at")
      .eq("match_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    setRecent(recents || []);

    if (userId) {
      const { data: mine } = await supabase
        .from("ratings")
        .select("*")
        .eq("match_id", id)
        .eq("user_id", userId)
        .maybeSingle();

      setMyRatingRow(mine || null);
      if (mine?.rating) setRating(mine.rating);
      if (typeof mine?.review === "string") setReview(mine.review || "");
    } else {
      setMyRatingRow(null);
      setRating(8);
      setReview("");
    }

    setLoading(false);
  }

  async function saveRating() {
    if (!userId) {
      onNeedLogin?.();
      return;
    }

    // BLOQUEO frontend (y además Supabase lo bloquea por policy)
    if (!isFinished) {
      alert("Este partido todavía no terminó. No se puede puntuar hasta que finalice.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        match_id: id,
        user_id: userId,
        rating: Number(rating),
        review: review?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("ratings").upsert(payload, {
        onConflict: "match_id,user_id",
      });

      if (error) throw error;

      await loadAll();
    } catch (e) {
      alert(e?.message || "Error guardando rating");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="muted" style={{ marginTop: 14 }}>Cargando…</div>;
  if (!match) return <div className="msg" style={{ marginTop: 14 }}>No se encontró el partido.</div>;

  return (
    <div style={{ marginTop: 14 }}>
      <div className="page-head">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className="page-title">
          <h2 style={{ margin: 0, color: "#f3f6ff" }}>{title}</h2>
          <div className="muted">
            {match.competition} • {new Date(match.match_date).toLocaleDateString("es-AR")}
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>
            Estado: <b>{match.status || "UNKNOWN"}</b>
            {!isFinished ? " • Puntuar bloqueado" : ""}
          </div>
        </div>

        <div className="page-stats">
          <span className="pill strong">
            {Number(match.avg_rating ?? 0).toFixed(2)}/10
          </span>
          <span className="pill">{match.ratings_count ?? 0} votos</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="score-big">{prettyScore(match.score)}</div>

        <div className="grid-2">
          <div className="card inner">
            <h3 style={{ marginTop: 0, color: "#f3f6ff" }}>Tu calificación</h3>

            {!userId ? (
              <div className="msg">
                Para puntuar tenés que iniciar sesión.
                <div style={{ marginTop: 10 }}>
                  <button className="btn" onClick={onNeedLogin}>
                    Ingresar
                  </button>
                </div>
              </div>
            ) : !isFinished ? (
              <div className="msg">
                Este partido todavía no terminó.
                <div className="muted" style={{ marginTop: 6 }}>
                  Se habilita automáticamente cuando pase a <b>FINISHED</b>.
                </div>
                <div style={{ marginTop: 10 }}>
                  <button className="btn" disabled>
                    Puntuar (bloqueado)
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="row">
                  <span className="pill">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <span className="pill">10</span>
                  <span className="pill strong">{rating}</span>
                </div>

                <label style={{ display: "block", marginTop: 12 }}>
                  Reseña (opcional)
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    placeholder="¿Por qué te gustó o no te gustó?"
                  />
                </label>

                <button className="btn" onClick={saveRating} disabled={saving}>
                  {saving ? "Guardando..." : myRatingRow ? "Actualizar" : "Guardar"}
                </button>
              </>
            )}
          </div>

          <div className="card inner">
            <h3 style={{ marginTop: 0, color: "#f3f6ff" }}>Reseñas recientes</h3>

            {recent.length === 0 ? (
              <div className="muted">Todavía no hay reseñas.</div>
            ) : (
              <div className="reviews">
                {recent.map((r) => (
                  <div key={r.id} className="review">
                    <div className="review-top">
                      <span className="pill strong">{r.rating}/10</span>
                      <span className="muted">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    {r.review ? (
                      <div style={{ color: "#f3f6ff" }}>{r.review}</div>
                    ) : (
                      <div className="muted">Sin texto.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
