import { useState } from "react";
import { apiFetch } from "../api";
import { X } from "lucide-react";

function AvatarEl({ src, name, size = 36 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--bg-tertiary)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.36, color: "var(--text-muted)",
        flexShrink: 0,
      }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : (name || "?")[0].toUpperCase()
      }
    </div>
  );
}

export default function GroupModal({ users, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleUser = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const group = await apiFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name, participantIds: selected }),
      });
      onCreated(group);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>Create Group</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: "10px 14px", marginBottom: 16,
              background: "rgba(220,60,60,0.1)", border: "1px solid var(--error)",
              borderRadius: "var(--radius-md)", color: "var(--error)", fontSize: "0.82rem",
            }}>
              {error}
            </div>
          )}

          {/* Group Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 7, fontWeight: 500 }}>
              Group Name
            </label>
            <input
              type="text"
              placeholder="Study Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", color: "var(--text-main)", outline: "none",
                fontSize: "0.9rem", transition: "border-color var(--transition)",
              }}
            />
          </div>

          {/* Participants */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>
              Participants ({selected.length} selected)
            </label>
            <div style={{
              maxHeight: 240, overflowY: "auto",
              background: "var(--bg-tertiary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}>
              {users.map((u) => (
                <label
                  key={u.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 14px", cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    transition: "background var(--transition)",
                    background: selected.includes(u.id) ? "var(--brand-subtle)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    style={{ accentColor: "var(--brand)", width: 15, height: 15 }}
                  />
                  <AvatarEl src={u.avatar} name={u.username} size={34} />
                  <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>{u.username}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
