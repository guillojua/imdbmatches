import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function prettyScore(score) {
  if (!score) return "TBD";
  const s = String(score).toLowerCase();
  if (s.includes("null")) return "TBD";
  if (s.trim() === "-" || s.trim() === "vs") return "TBD";
  return score;
}

export default function MatchModal({ open, onClose, match, session, onSaved }) {
  const userId = session?.user?.id || null;

  const [myRatingRow, setMyRatingRow] = useState(null);
  const [rating, setRating] = useState(8);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState([]);

  const canRate = !!userId;

  useEffect(() => {
    if (!open || !match) return;

    (async () => {
      // Mi rating (si está logueado)
      if (userId) {
        const { data } = await supabase
          .from("ratings")
          .select("*")
          .eq("match_id", match.id)
          .eq("user_id", userId)
          .maybeSingle();

        setMyRatingRow(data || null);
        if (data?.rating) setRating(data.rating);
        if (typeof data?.review === "string") setReview(data.review || "");
      } else {
        setMyRatingRow(null);
        setRating(8);
        setReview("");
      }

      // Reseñas recientes
      const { data: recents } = await supabase
        .from("ratings")
        .select("id, rating, review, created_at")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setRecent(recents || []);
    })();
  }, [open, match, userId]);

  const title = useMemo(() => {
    if (!match) return "";
    return `${match.home} vs ${match.away}`;
  }, [match]);

  async function saveRating() {
    if (!canRate) return;

    setSaving(true);
    try {
      const payload = {
        match_id: match.id,
        user_id: userId,
        rating: Number(rating),
        review: review?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("ratings").upsert(payload, {
        onConflict: "match_id,user_id",
      });

      if (error) throw error;

      onSaved?.();
      onClose?.();
    } catch (err) {
      alert(err?.message || "Error guardando rating");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !match) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0, color: "#f3f6ff" }}>{title}</h2>
            <div className="muted">
              {match.competition} • {new Date(match.match_date).toLocaleString()}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="modal-body">
          <div className="score-big">{prettyScore(match.score)}</div>

          <div className="grid-2">
            <div className="card inner">
              <h3 style={{ marginTop: 0, color: "#f3f6ff" }}>Tu calificación</h3>

              {!canRate ? (
                <div className="msg">Para puntuar tenés que iniciar sesión.</div>
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
    </div>
  );
}
