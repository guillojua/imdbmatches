import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const LEAGUE_FILTERS = [
  { label: "Todas", value: "ALL" },
  { label: "Premier League", value: "Premier League" },
  { label: "La Liga", value: "La Liga" },
  { label: "Serie A", value: "Serie A" },
  { label: "Bundesliga", value: "Bundesliga" },
  { label: "Ligue 1", value: "Ligue 1" },
];

const SORTS = [
  // IMPORTANTE: cambia el orden por defecto para que NO te muestre el futuro primero
  { label: "Finalizados (más recientes)", value: "finished_recent" },
  { label: "Próximos (más cercanos)", value: "upcoming_soon" },
  { label: "Mejor puntuados (IMDB)", value: "top" },
  { label: "Más votados", value: "votes" },
];

function prettyScore(score) {
  if (!score) return "TBD";
  const s = String(score).toLowerCase();
  if (s.includes("null")) return "TBD";
  if (s.trim() === "-" || s.trim() === "vs") return "TBD";
  return score;
}

function formatDateDMY(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isFinished(m) {
  return m?.status === "FINISHED";
}

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [league, setLeague] = useState("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("finished_recent"); // ✅ default

  const navigate = useNavigate();

  useEffect(() => {
    loadMatches(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMatches(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  async function loadMatches(sortMode) {
    setLoading(true);

    // Traemos un buen volumen (2025-2026 es bastante)
    const { data, error } = await supabase.from("matches_with_stats").select("*").limit(1500);
    if (error) console.error(error);

    setMatches(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return (matches || []).filter((m) => {
      // solo 2025 y 2026
      const year = new Date(m.match_date).getFullYear();
      if (year !== 2025 && year !== 2026) return false;

      const okLeague = league === "ALL" ? true : m.competition === league;
      if (!okLeague) return false;

      if (!needle) return true;
      const text = `${m.home} ${m.away} ${m.competition} ${m.score} ${m.status}`.toLowerCase();
      return text.includes(needle);
    });
  }, [matches, league, q]);

  const sorted = useMemo(() => {
    const list = filtered.slice();

    const time = (m) => new Date(m.match_date).getTime();
    const avg = (m) => Number(m.avg_rating ?? 0);
    const votes = (m) => Number(m.ratings_count ?? 0);

    if (sort === "finished_recent") {
      // FINISHED primero, ordenado por fecha DESC (más reciente primero)
      // luego los no finalizados, ordenados por fecha ASC (los más cercanos arriba)
      list.sort((a, b) => {
        const af = isFinished(a) ? 0 : 1;
        const bf = isFinished(b) ? 0 : 1;
        if (af !== bf) return af - bf;

        if (isFinished(a) && isFinished(b)) return time(b) - time(a);
        return time(a) - time(b);
      });
      return list;
    }

    if (sort === "upcoming_soon") {
      // Próximos primero (no FINISHED), por fecha ASC (más cercano arriba),
      // y al final FINISHED por fecha DESC
      list.sort((a, b) => {
        const aUp = isFinished(a) ? 1 : 0;
        const bUp = isFinished(b) ? 1 : 0;
        if (aUp !== bUp) return aUp - bUp;

        if (!isFinished(a) && !isFinished(b)) return time(a) - time(b);
        return time(b) - time(a);
      });
      return list;
    }

    if (sort === "top") {
      list.sort((a, b) => {
        const br = avg(b) - avg(a);
        if (br !== 0) return br;
        const bv = votes(b) - votes(a);
        if (bv !== 0) return bv;
        return time(b) - time(a);
      });
      return list;
    }

    if (sort === "votes") {
      list.sort((a, b) => {
        const bv = votes(b) - votes(a);
        if (bv !== 0) return bv;
        const br = avg(b) - avg(a);
        if (br !== 0) return br;
        return time(b) - time(a);
      });
      return list;
    }

    return list;
  }, [filtered, sort]);

  return (
    <>
      <div className="toolbar">
        <select value={league} onChange={(e) => setLeague(e.target.value)}>
          {LEAGUE_FILTERS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar equipo / liga / score / status…"
        />

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button className="btn btn-ghost" onClick={() => loadMatches(sort)} disabled={loading}>
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      <main className="grid">
        {loading ? (
          <div className="muted">Cargando partidos...</div>
        ) : sorted.length === 0 ? (
          <div className="muted">No hay partidos para mostrar.</div>
        ) : (
          sorted.map((m) => {
            const finished = isFinished(m);
            const statusText = finished ? "Finalizado" : "Bloqueado";
            return (
              <button
                key={m.id}
                className={finished ? "match-card" : "match-card locked"}
                onClick={() => navigate(`/match/${m.id}`)}
                title="Abrir partido"
              >
                <div className="match-head">
                  <div className="teams">
                    <div className="teams-main">
                      {m.home} <span className="muted">vs</span> {m.away}
                    </div>
                    <div className="muted small">
                      {m.competition} • {formatDateDMY(m.match_date)}
                    </div>
                  </div>

                  <div className="scorebox">
                    <div className="score">{prettyScore(m.score)}</div>
                    <div className={finished ? "chip ok" : "chip lock"}>
                      {finished ? "✅ " : "🔒 "}
                      {statusText}
                    </div>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat">
                    <div className="stat-label">IMDB</div>
                    <div className="stat-value">
                      {Number(m.avg_rating ?? 0).toFixed(2)} <span className="muted">/10</span>
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Votos</div>
                    <div className="stat-value">{m.ratings_count ?? 0}</div>
                  </div>
                </div>

                <div className="hint">{finished ? "Click para ver / puntuar" : "Click para ver (puntuar bloqueado)"}</div>
              </button>
            );
          })
        )}
      </main>
    </>
  );
}
