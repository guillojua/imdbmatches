import Auth from "./Auth";

export default function AuthModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal auth-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0, color: "#f3f6ff" }}>Ingresar</h2>
            <div className="muted">Google 1-click o email/password.</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="modal-body">
          <Auth onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
