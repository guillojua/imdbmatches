import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import TopByLeague from "../components/TopByLeague";

export default function TopPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("matches_with_stats")
        .select("*")
        .order("match_date", { ascending: false })
        .limit(800);

      if (error) console.error(error);
      setMatches(data || []);
      setLoading(false);
    })();
  }, []);

  const topGeneral = useMemo(() => {
    return (matches || [])
      .filter((m) => (m.ratings_count ?? 0) > 0)
      .slice()
      .sort((a, b) => {
        const ar = Number(a.avg_rating ?? 0);
        const br = Number(b.avg_rating ?? 0);
        if (br !== ar) return br - ar;
        const av = Number(a.ratings_count ?? 0);
        const bv = Number(b.ratings_count ?? 0);
        if (bv !== av) return bv - av;
        return new Date(b.match_date).getTime() - new Date(a.match_date).getTime();
      })
      .slice(0, 20);
  }, [matches]);

  const mostVoted = useMemo(() => {
    return (matches || [])
      .filter((m) => (m.ratings_count ?? 0) > 0)
      .slice()
      .sort((a, b) => {
        const av = Number(a.ratings_count ?? 0);
        const bv = Number(b.ratings_count ?? 0);
        if (bv !== av) return bv - av;
        const ar = Number(a.avg_rating ?? 0);
        const br = Number(b.avg_rating ?? 0);
        if (br !== ar) return br - ar;
        return new Date(b.match_date).getTime() - new Date(a.match_date).getTime();
      })
      .slice(0, 20);
  }, [matches]);

  return (
    <div style={{ marginTop: 14 }}>
      <div className="page-head">
        <div className="page-title">
          <h2 style={{ margin: 0, color: "#f3f6ff" }}>Rankings</h2>
          <div className="muted">Top IMDB, más votados y top por liga.</div>
        </div>
      </div>

      {loading ? (
        <div className="muted" style={{ marginTop: 12 }}>Cargando…</div>
      ) : (
        <>
          <section className="hero-rankings" style={{ marginTop: 12 }}>
            <div className="hero-col card">
              <div className="hero-title">
                <span className="badge badge-gold">Top IMDB</span>
                <span className="muted small">Mejor puntuados</span>
              </div>

              {topGeneral.length === 0 ? (
                <div className="muted">Todavía no hay votos.</div>
              ) : (
                <div className="hero-list">
                  {topGeneral.map((m, idx) => (
                    <button key={m.id} className="hero-row" onClick={() => navigate(`/match/${m.id}`)}>
                      <div className="hero-rank">#{idx + 1}</div>
                      <div className="hero-main">
                        <div className="hero-teams">
                          {m.home} <span className="muted">vs</span> {m.away}
                        </div>
                        <div className="muted small">{m.competition}</div>
                      </div>
                      <div className="hero-right">
                        <div className="hero-score">
                          {Number(m.avg_rating ?? 0).toFixed(2)} <span className="muted">/10</span>
                        </div>
                        <div className="muted small">{m.ratings_count ?? 0} votos</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hero-col card">
              <div className="hero-title">
                <span className="badge badge-green">Más votados</span>
                <span className="muted small">Popularidad</span>
              </div>

              {mostVoted.length === 0 ? (
                <div className="muted">Todavía no hay votos.</div>
              ) : (
                <div className="hero-list">
                  {mostVoted.map((m, idx) => (
                    <button key={m.id} className="hero-row" onClick={() => navigate(`/match/${m.id}`)}>
                      <div className="hero-rank">#{idx + 1}</div>
                      <div className="hero-main">
                        <div className="hero-teams">
                          {m.home} <span className="muted">vs</span> {m.away}
                        </div>
                        <div className="muted small">{m.competition}</div>
                      </div>
                      <div className="hero-right">
                        <div className="hero-score">
                          {Number(m.avg_rating ?? 0).toFixed(2)} <span className="muted">/10</span>
                        </div>
                        <div className="muted small">{m.ratings_count ?? 0} votos</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div style={{ marginTop: 12 }}>
            <TopByLeague onOpenMatch={(m) => navigate(`/match/${m.id}`)} />
          </div>
        </>
      )}
    </div>
  );
}
