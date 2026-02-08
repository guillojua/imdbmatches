import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTADOR 2025-2026 (jugados + futuros)
 * Node 18+ tiene fetch nativo (vos tenés Node 24)
 */

const SUPABASE_URL = "https://fxbbaaklkylnfdfylcqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YmJhYWtsa3lsbmZkZnlsY3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTA3MzIsImV4cCI6MjA4NjEyNjczMn0.VqdJCEjUpGGUm9ntmgX-x2pf2Krs6ig4Iq7v9qDzSOw";
const FOOTBALL_DATA_API_KEY = "dea79dc703f747dfb160d7d9ea1e5abc";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LEAGUES = [
  { id: 2021, name: "Premier League" },
  { id: 2014, name: "La Liga" },
  { id: 2019, name: "Serie A" },
  { id: 2002, name: "Bundesliga" },
  { id: 2015, name: "Ligue 1" },
];

const DATE_FROM = "2025-01-01";
const DATE_TO = "2027-01-01";

function buildScore(m) {
  const h = m?.score?.fullTime?.home;
  const a = m?.score?.fullTime?.away;
  if (h == null || a == null) return null;
  return `${h}-${a}`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "X-Auth-Token": FOOTBALL_DATA_API_KEY },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

async function loadLeague(league) {
  console.log("\n===============================");
  console.log("Cargando:", league.name);
  console.log("===============================");

  const url =
    `https://api.football-data.org/v4/competitions/${league.id}/matches` +
    `?dateFrom=${DATE_FROM}&dateTo=${DATE_TO}`;

  const json = await fetchJson(url);

  if (!json?.matches) {
    console.log("Respuesta inesperada:", json);
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const m of json.matches) {
    const payload = {
      api_id: m.id,
      home: m.homeTeam?.name ?? "TBD",
      away: m.awayTeam?.name ?? "TBD",
      competition: league.name,
      match_date: m.utcDate,
      score: buildScore(m),
      status: m.status ?? null,
    };

    const { error } = await supabase
      .from("matches")
      .upsert(payload, { onConflict: "api_id" });

    if (error) {
      fail++;
      console.log("❌", error.message, "->", payload.home, "vs", payload.away);
    } else {
      ok++;
    }
  }

  console.log(`✅ ${league.name}: ${ok} ok / ${fail} error`);
}

async function main() {
  try {
    for (const league of LEAGUES) {
      await loadLeague(league);
    }
    console.log("\n🔥 IMPORT 2025-2026 COMPLETO");
  } catch (e) {
    console.error("\n🚨 ERROR:", e.message);
  }
}

main();
