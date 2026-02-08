import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LEAGUES = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
];

function prettyScore(score) {
  if (!score) return "TBD";
  const s = String(score).toLowerCase();
  if (s.includes("null")) return "TBD";
  if (s.trim() === "-" || s.trim() === "vs") return "TBD";
  return score;
}

export default function TopByLeague({ onOpenMatch }) {
  const [loading, setLoading] = useState(true);
  const [tops, setTops] = useState({}); // { leagueName: matches[] }
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.all(
          LEAGUES.map(async (league) => {
            const { data, error } = await supabase
              .from("matches_with_stats")
              .select("*")
              .eq("competition", league)
              .order("avg_rating", { ascending: false })
              .order("ratings_count", { ascending: false })
              .order("match_date", { ascending: false })
              .limit(10);

            if (error) throw error;
            return [league, data || []];
          })
        );

        if (!mounted) return;

        const obj = {};
        for (const [league, list] of results) obj[league] = list;
        setTops(obj);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Error cargando tops");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const leaguesWithData = useMemo(() => {
    return LEAGUES.filter((l) => (tops[l]?.length || 0) > 0);
  }, [tops]);

  return (
    <div className="top-section">
      <div className="top-head">
        <div>
          <h2 className="h2">Top por liga</h2>
          <div className="muted">Los 10 partidos mejor puntuados en cada liga.</div>
        </div>
      </div>

      {loading ? (
        <div className="muted">Cargando tops…</div>
      ) : error ? (
        <div className="msg">{error}</div>
      ) : leaguesWithData.length === 0 ? (
        <div className="muted">Todavía no hay suficientes votos para armar tops.</div>
      ) : (
        <div className="top-grid">
          {leaguesWithData.map((league) => (
            <div key={league} className="top-league card">
              <div className="top-league-title">
                <span className="badge">{league}</span>
              </div>

              <div className="top-list">
                {tops[league].map((m, idx) => (
                  <button
                    key={m.id}
                    className="top-row"
                    onClick={() => onOpenMatch?.(m)}
                    title="Abrir partido"
                  >
                    <div className="top-rank">#{idx + 1}</div>
                    <div className="top-main">
                      <div className="top-teams">
                        {m.home} <span className="muted">vs</span> {m.away}
                      </div>
                      <div className="muted small">
                        {new Date(m.match_date).toLocaleDateString()} • {prettyScore(m.score)}
                      </div>
                    </div>
                    <div className="top-right">
                      <div className="top-score">
                        {Number(m.avg_rating ?? 0).toFixed(2)} <span className="muted">/10</span>
                      </div>
                      <div className="muted small">{m.ratings_count ?? 0} votos</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
