import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Phone, Video, UserPlus, MessageCircle, Users, X } from "lucide-react";

function AvatarEl({ src, name, size = 42, online = false }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size, height: size, borderRadius: "50%",
          background: "var(--bg-tertiary)", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: size * 0.36, color: "var(--text-muted)",
        }}
      >
        {src
          ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (name || "?")[0].toUpperCase()
        }
      </div>
      {online && (
        <span style={{
          position: "absolute", bottom: 0, right: 0,
          width: 11, height: 11, borderRadius: "50%",
          background: "var(--success)", border: "2px solid var(--bg-primary)",
        }} />
      )}
    </div>
  );
}

// Add Contact modal
function AddContactModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Both fields are required."); return; }
    onAdd(name.trim(), email.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>New Contact</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div style={{ color: "var(--error)", fontSize: "0.82rem", marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", color: "var(--text-main)", outline: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", color: "var(--text-main)", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CALL_ICONS = {
  Missed:   { Icon: Phone, color: "var(--error)",   label: "Missed" },
  Incoming: { Icon: Phone, color: "var(--success)",  label: "Incoming" },
  Outgoing: { Icon: Phone, color: "var(--text-dim)", label: "Outgoing" },
};

export default function ContactsView({ onSelectChat, initialTab = "friends" }) {
  const { contacts, addContact, calls, addCall } = useAuth();
  const { onlineUsers } = useSocket();
  const [activeTab, setActiveTab] = useState(initialTab === "calls" ? "calls" : "online");
  const [showAddModal, setShowAddModal] = useState(false);

  const online = contacts.filter((c) => onlineUsers.has(c.id));

  // Alphabetical grouping of all contacts
  const grouped = contacts.reduce((acc, c) => {
    const l = c.name[0]?.toUpperCase() || "#";
    if (!acc[l]) acc[l] = [];
    acc[l].push(c);
    return acc;
  }, {});
  const letters = Object.keys(grouped).sort();

  const handleCallBack = (call) => {
    addCall(call.name, "Outgoing", call.avatar);
    onSelectChat({ id: call.id, name: call.name, avatar: call.avatar, isGroup: false });
  };

  // Right panel — "Active Now"
  const RightPanel = () => (
    <div
      style={{
        width: 240, minWidth: 220,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        overflowY: "auto", flexShrink: 0,
        padding: "16px",
      }}
    >
      <div className="right-panel-heading">Active Now</div>
      {online.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-dim)", fontSize: "0.82rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10, opacity: 0.4 }}>👤+</div>
          <p>It's quiet for now…</p>
          <p style={{ marginTop: 8, lineHeight: 1.5, fontSize: "0.75rem" }}>
            When a friend comes online, they'll show up here!
          </p>
        </div>
      ) : (
        online.map((c) => (
          <div key={c.id} className="member-item">
            <div className="member-avatar">
              <AvatarEl src={c.avatar} name={c.name} size={34} online />
            </div>
            <div className="member-name">{c.name}</div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Sub-tabs header */}
      <div className="contacts-header-tabs">
        <div className="contacts-tab-title">
          <Users size={18} /> Friends
        </div>
        {["online", "all", "calls"].map((t) => (
          <div
            key={t}
            className={`contacts-sub-tab ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t === "online" ? "Online" : t === "all" ? "All" : "Calls"}
          </div>
        ))}
        <button className="add-friend-btn" onClick={() => setShowAddModal(true)}>
          + Add Contact
        </button>
      </div>

      {/* Content + right panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="contacts-content">
          {/* ── CALLS TAB ── */}
          {activeTab === "calls" && (
            <>
              <div className="contacts-section-heading">Recent Calls</div>
              {calls.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", padding: "24px 0" }}>No call history.</div>
              ) : (
                calls.map((call) => {
                  const info = CALL_ICONS[call.type] || CALL_ICONS.Outgoing;
                  return (
                    <div key={call.id} className="call-row">
                      <AvatarEl src={call.avatar} name={call.name} size={42} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{call.name}</div>
                        <div className={`call-type ${call.type?.toLowerCase()}`} style={{ color: info.color }}>
                          {call.type} · {call.timestamp}
                        </div>
                      </div>
                      <button className="contact-action-btn" title="Call back" onClick={() => handleCallBack(call)}>
                        <Phone size={15} />
                      </button>
                      <button className="contact-action-btn" title="Video call">
                        <Video size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ── ONLINE / ALL TABS ── */}
          {activeTab !== "calls" && (
            <>
              {activeTab === "online" && (
                <>
                  <div className="contacts-section-heading">
                    Online — {online.length}
                  </div>
                  {online.length === 0 ? (
                    <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", padding: "16px 0" }}>
                      No contacts online right now.
                    </div>
                  ) : (
                    online.map((c) => (
                      <ContactRow key={c.id} contact={c} online={true} onSelectChat={onSelectChat} addCall={addCall} />
                    ))
                  )}
                </>
              )}

              {activeTab === "all" && (
                <>
                  <div className="contacts-section-heading">Contacts — {contacts.length}</div>
                  {letters.map((letter) => (
                    <div key={letter}>
                      <div style={{
                        fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.1em", color: "var(--text-dim)",
                        padding: "10px 0 6px", marginTop: 8,
                      }}>
                        {letter}
                      </div>
                      {grouped[letter].map((c) => (
                        <ContactRow
                          key={c.id}
                          contact={c}
                          online={onlineUsers.has(c.id)}
                          onSelectChat={onSelectChat}
                          addCall={addCall}
                        />
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <RightPanel />
      </div>

      {showAddModal && (
        <AddContactModal onClose={() => setShowAddModal(false)} onAdd={addContact} />
      )}
    </div>
  );
}

function ContactRow({ contact, online, onSelectChat, addCall }) {
  return (
    <div className="contact-row">
      <AvatarEl src={contact.avatar} name={contact.name} size={42} online={online} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="contact-name">{contact.name}</div>
        <div className="contact-sub" style={{ color: online ? "var(--brand)" : "var(--text-dim)" }}>
          {online ? "Online" : contact.email}
        </div>
      </div>
      <div className="contact-actions">
        <button
          className="contact-action-btn"
          title="Message"
          onClick={() => onSelectChat({ id: contact.id, name: contact.name, avatar: contact.avatar, isGroup: false })}
        >
          <MessageCircle size={15} />
        </button>
        <button
          className="contact-action-btn"
          title="Call"
          onClick={() => addCall(contact.name, "Outgoing", contact.avatar)}
        >
          <Phone size={15} />
        </button>
        <button className="contact-action-btn" title="Video call">
          <Video size={15} />
        </button>
      </div>
    </div>
  );
}
