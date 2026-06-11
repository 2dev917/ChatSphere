import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";
import { MessageCircle, Users, Phone, Map, Settings, Plus, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import MapView from "./MapView";
import SettingsView from "./SettingsView";
import GroupModal from "./GroupModal";
import ContactsView from "./ContactsView";

// Narrow icon rail on the far left
function IconRail({ tab, setTab, onOpenSettings, user, onLogout }) {
  const navItems = [
    { id: "chats",    Icon: MessageCircle, label: "Messages" },
    { id: "contacts", Icon: Users,         label: "Friends" },
    { id: "calls",    Icon: Phone,         label: "Calls" },
    { id: "map",      Icon: Map,           label: "Live Map" },
  ];

  return (
    <div className="icon-rail">
      {/* Logo */}
      <div className="rail-logo" title="ChatSphere">🌐</div>
      <div className="rail-sep" />

      {navItems.map(({ id, Icon, label }) => (
        <button
          key={id}
          className={`rail-btn ${tab === id ? "active" : ""}`}
          onClick={() => setTab(id)}
          title={label}
        >
          <Icon size={20} />
          <span className="rail-tooltip">{label}</span>
        </button>
      ))}

      <div className="rail-spacer" />

      <button
        className={`rail-btn ${tab === "settings" ? "active" : ""}`}
        onClick={() => setTab("settings")}
        title="Settings"
      >
        <Settings size={20} />
        <span className="rail-tooltip">Settings</span>
      </button>

      {/* User avatar at bottom */}
      <div style={{ position: "relative", marginTop: 8, cursor: "pointer" }} title={user?.username}>
        <div
          style={{
            width: 36, height: 36,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.85rem", color: "#fff",
            border: "2px solid var(--brand)",
            overflow: "hidden",
            transition: "border-color var(--transition)",
          }}
          onClick={() => setTab("settings")}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (user?.username?.[0] || "U").toUpperCase()
          }
        </div>
        <span
          style={{
            position: "absolute", bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--success)",
            border: "2px solid var(--bg-primary)",
          }}
        />
      </div>
    </div>
  );
}

export default function MainApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("chats");
  const [settingsSection, setSettingsSection] = useState("profile");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = async (q = "") => {
    const data = q
      ? await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      : await apiFetch("/api/users");
    setUsers(data);
  };

  const loadGroups = async () => {
    const data = await apiFetch("/api/groups");
    setGroups(data);
  };

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setTab("chats");
  };

  const handleGroupCreated = (group) => {
    setGroups((prev) => [...prev, group]);
    setShowGroupModal(false);
    setActiveChat({ id: group.id, name: group.name, isGroup: true });
  };

  const handleSetSettingsSection = (section) => {
    setSettingsSection(section);
    setTab("settings");
  };

  return (
    <div className="app-shell">
      {/* Far-left icon rail */}
      <IconRail
        tab={tab}
        setTab={setTab}
        user={user}
        onLogout={logout}
      />

      {/* Sidebar */}
      <Sidebar
        user={user}
        tab={tab}
        setTab={setTab}
        users={users}
        groups={groups}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onLogout={logout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateGroup={() => setShowGroupModal(true)}
        settingsSection={settingsSection}
        setSettingsSection={setSettingsSection}
      />

      {/* Main content */}
      <div className="content-area">
        {tab === "chats" && (
          <ChatView
            activeChat={activeChat}
            users={users}
            onOpenMap={() => setTab("map")}
          />
        )}
        {tab === "contacts" && (
          <ContactsView onSelectChat={handleSelectChat} />
        )}
        {tab === "calls" && (
          <ContactsView onSelectChat={handleSelectChat} initialTab="calls" />
        )}
        {tab === "map" && (
          <MapView users={users} activeChat={activeChat} />
        )}
        {tab === "settings" && (
          <SettingsView section={settingsSection} onChangeSection={setSettingsSection} />
        )}
      </div>

      {showGroupModal && (
        <GroupModal
          users={users}
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
