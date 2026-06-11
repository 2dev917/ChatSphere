import { useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Plus, Search, Mic, Headphones, Settings, MessageCircle } from "lucide-react";

function AvatarEl({ src, name, size = 42, online = false }) {
  const initial = (name || "?")[0].toUpperCase();
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size, height: size,
          borderRadius: "50%",
          background: "var(--bg-tertiary)",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: size * 0.38,
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {src
          ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initial
        }
      </div>
      {online !== undefined && (
        <span
          className={`chat-item-status ${online ? "online" : ""}`}
          style={{ borderColor: "var(--bg-secondary)" }}
        />
      )}
    </div>
  );
}

export default function Sidebar({
  user, tab, setTab, users, groups, activeChat,
  onSelectChat, onLogout, searchQuery, setSearchQuery,
  onCreateGroup, settingsSection, setSettingsSection,
}) {
  const { onlineUsers } = useSocket();
  const [activeFilter, setActiveFilter] = useState("All");

  // ── Chat list items ──────────────────────────
  const chatItems = tab === "chats"
    ? [
        ...users.map((u) => ({
          id: u.id, name: u.username, avatar: u.avatar, isGroup: false,
          online: onlineUsers.has(u.id),
          preview: onlineUsers.has(u.id) ? "Online" : "Offline",
        })),
        ...groups.map((g) => ({
          id: g.id, name: g.name, avatar: null, isGroup: true, online: false,
          preview: `${g.participants?.length ?? 0} members`,
        })),
      ]
    : [];

  const filtered = chatItems.filter((item) => {
    if (activeFilter === "Groups") return item.isGroup;
    if (activeFilter === "Unread") return false;
    if (activeFilter === "Favorites") return false;
    return true;
  });

  // ── Settings nav ─────────────────────────────
  const settingsNav = [
    { id: "profile",       label: "Profile" },
    { id: "account",       label: "Account" },
    { id: "privacy",       label: "Privacy & Security" },
    { id: "notifications", label: "Notifications" },
    { id: "storage",       label: "Storage & Data" },
    { id: "appearance",    label: "Appearance" },
    { id: "help",          label: "Help" },
  ];

  const filters = ["All", "Unread", "Favorites", "Groups"];

  // ── Header label per tab ─────────────────────
  const headerTitle = {
    chats:    "Messages",
    contacts: "Friends",
    calls:    "Calls",
    map:      "Live Map",
    settings: "Settings",
  }[tab] || "ChatSphere";

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div>
          <div className="sidebar-title">{headerTitle}</div>
          {tab === "chats" && (
            <div className="sidebar-subtitle">{users.length} contacts</div>
          )}
        </div>
        {tab === "chats" && (
          <button className="btn btn-primary btn-sm" onClick={onCreateGroup} title="New Group">
            <Plus size={14} /> Group
          </button>
        )}
      </div>

      {/* Search (only in chats tab) */}
      {tab === "chats" && (
        <div className="sidebar-search">
          <div className="sidebar-search-wrap">
            <Search size={15} className="sidebar-search-icon" />
            <input
              placeholder="Find a chat…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Filter chips (only in chats tab) */}
      {tab === "chats" && (
        <div className="sidebar-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-chip ${activeFilter === f ? "active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* ── CONTENT ── */}
      {tab === "chats" && (
        <div className="sidebar-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-dim)", fontSize: "0.85rem" }}>
              <MessageCircle size={36} style={{ opacity: 0.3, margin: "0 auto 10px", display: "block" }} />
              No chats found
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`chat-item ${activeChat?.id === item.id ? "active" : ""}`}
                onClick={() => onSelectChat(item)}
              >
                <div className="chat-item-avatar">
                  <AvatarEl src={item.avatar} name={item.name} size={42} online={item.online} />
                </div>
                <div className="chat-item-body">
                  <div className="chat-item-name">{item.name}</div>
                  <div className={`chat-item-preview ${item.online && !item.isGroup ? "typing" : ""}`}>
                    {item.preview}
                  </div>
                </div>
                <div className="chat-item-meta">
                  <span className="chat-item-time">Now</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contacts tab sidebar content */}
      {tab === "contacts" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          <div style={{ padding: "8px 12px 4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)" }}>Your Contacts</div>
          {users.map((u) => (
            <div
              key={u.id}
              className="chat-item"
              onClick={() => onSelectChat({ id: u.id, name: u.username, avatar: u.avatar, isGroup: false })}
            >
              <div className="chat-item-avatar">
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg-tertiary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.username?.[0] || "U").toUpperCase()}
                </div>
                <span className={`chat-item-status ${onlineUsers.has(u.id) ? "online" : ""}`} />
              </div>
              <div className="chat-item-body">
                <div className="chat-item-name">{u.username}</div>
                <div className="chat-item-preview" style={{ color: onlineUsers.has(u.id) ? "var(--brand)" : undefined }}>{onlineUsers.has(u.id) ? "● Online" : "Offline"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calls tab sidebar content */}
      {tab === "calls" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          <div style={{ padding: "8px 12px 4px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)" }}>Recent Calls</div>
          {users.slice(0, 6).map((u) => (
            <div key={u.id} className="chat-item">
              <div className="chat-item-avatar">
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg-tertiary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.username?.[0] || "U").toUpperCase()}
                </div>
              </div>
              <div className="chat-item-body">
                <div className="chat-item-name">{u.username}</div>
                <div className="chat-item-preview">No recent calls</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map tab sidebar content */}
      {tab === "map" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <div style={{ padding: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: 12 }}>Live Sharing</div>
          <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: "14px", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>📍</div>
            Share your location with contacts in a DM. Their position will appear on the map.
          </div>
        </div>
      )}

      {/* Settings nav */}
      {tab === "settings" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
            <div className="settings-nav-group-label">User Settings</div>
            {settingsNav.map((item) => (
              <div
                key={item.id}
                className={`settings-nav-item ${settingsSection === item.id ? "active" : ""}`}
                onClick={() => setSettingsSection && setSettingsSection(item.id)}
              >
                {item.label}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-danger" style={{ width: "100%" }} onClick={onLogout}>
              <span style={{ fontSize: "0.9rem" }}>⬡</span> Sign Out
            </button>
          </div>
        </>
      )}

      {/* Footer — shown only when NOT in settings tab */}
      {tab !== "settings" && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-avatar" onClick={() => { setTab("settings"); setSettingsSection?.("profile"); }}>
            <div
              style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.85rem", color: "#fff",
                border: "2px solid var(--brand)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.username?.[0] || "U").toUpperCase()
              }
            </div>
          </div>
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-name">{user?.displayName || user?.username}</div>
            <div className="sidebar-footer-tag" style={{ color: "var(--brand)" }}>● Online</div>
          </div>
          <div className="sidebar-footer-actions">
            <button className="footer-icon-btn" title="Mic"><Mic size={15} /></button>
            <button className="footer-icon-btn" title="Headphones"><Headphones size={15} /></button>
            <button
              className="footer-icon-btn"
              title="Settings"
              onClick={() => { setTab("settings"); setSettingsSection?.("profile"); }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
