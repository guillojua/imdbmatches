import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

import HomePage from "./pages/HomePage";
import MatchPage from "./pages/MatchPage";
import TopPage from "./pages/TopPage";
import MyRatingsPage from "./pages/MyRatingsPage";

import AuthModal from "./components/AuthModal";
import ResetPasswordModal from "./components/ResetPasswordModal";

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);

      if (event === "PASSWORD_RECOVERY") {
        setShowReset(true);
      }

      if (event === "SIGNED_IN") {
        setShowAuth(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div className="container">
      <header className="topbar">
        <div>
          <div className="brand">
            <div className="logo">⚽</div>
            <div>
              <h1 className="title">imdbmatches.com</h1>
              <div className="muted">Calificá partidos como si fueran películas.</div>
            </div>
          </div>

          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => (isActive ? "navlink active" : "navlink")}>
              Inicio
            </NavLink>
            <NavLink to="/top" className={({ isActive }) => (isActive ? "navlink active" : "navlink")}>
              Tops
            </NavLink>
            <NavLink to="/my" className={({ isActive }) => (isActive ? "navlink active" : "navlink")}>
              Mis ratings
            </NavLink>
          </nav>
        </div>

        <div className="authbox">
          {session ? (
            <>
              <div className="muted small">{session.user.email}</div>
              <button className="btn btn-ghost" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => setShowAuth(true)}>
              Ingresar
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage session={session} onNeedLogin={() => setShowAuth(true)} />} />
        <Route path="/top" element={<TopPage />} />
        <Route path="/match/:id" element={<MatchPage session={session} onNeedLogin={() => setShowAuth(true)} />} />
        <Route path="/my" element={<MyRatingsPage session={session} onNeedLogin={() => setShowAuth(true)} />} />
      </Routes>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <ResetPasswordModal open={showReset} onClose={() => setShowReset(false)} />
    </div>
  );
}
