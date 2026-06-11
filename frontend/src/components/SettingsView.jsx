import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  User, Lock, Shield, Bell, HardDrive, Palette, HelpCircle,
  Eye, Image, Info, MessageSquare, Settings, Download,
  Edit3, Save, X, Check, LogOut
} from "lucide-react";

// ─────────────────────────────────────────
// Reusable UI sub-components
// ─────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-wrap">
      <input type="checkbox" className="toggle-input" checked={checked} onChange={onChange} />
      <div className="toggle-track" />
      <div className="toggle-thumb" />
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select className="settings-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Row({ icon: Icon, label, sublabel, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        {Icon && (
          <div className="settings-row-icon">
            <Icon size={16} />
          </div>
        )}
        <div className="settings-row-text">
          <p>{label}</p>
          {sublabel && <p>{sublabel}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function AvatarLg({ src, name }) {
  return (
    <div className="profile-avatar-lg">
      {src ? (
        <img src={src} alt={name} />
      ) : (
        <div className="avatar-fallback">
          {(name || "?")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Profile
// ─────────────────────────────────────────
function ProfileSection({ user, updateProfile }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const { storageUsed, theme, setTheme, desktopPush, setDesktopPush, messagePreviews, setMessagePreviews } = useAuth();

  const handleSave = () => {
    updateProfile(displayName, username, bio);
    setEditing(false);
  };

  const totalGB = 5;
  const usedGB = (storageUsed / 1024).toFixed(1);
  const usedPct = Math.min((storageUsed / (totalGB * 1024)) * 100, 100);

  return (
    <div>
      {/* Profile header */}
      <div className="profile-header">
        <AvatarLg src={user?.avatar} name={user?.displayName || user?.username} />
        <div>
          <div className="profile-name">{user?.displayName || user?.username}</div>
          <div className="profile-tag">@{user?.username}</div>
        </div>
      </div>

      <div className="settings-section-title">Personal Information</div>

      <div className="settings-field">
        <label>Display Name</label>
        <input
          className="settings-input"
          value={displayName}
          readOnly={!editing}
          onChange={(e) => setDisplayName(e.target.value)}
          style={!editing ? { cursor: "default" } : {}}
        />
      </div>
      <div className="settings-field">
        <label>Username</label>
        <input
          className="settings-input"
          value={username}
          readOnly={!editing}
          onChange={(e) => setUsername(e.target.value)}
          style={!editing ? { cursor: "default" } : {}}
        />
      </div>
      <div className="settings-field">
        <label>Bio</label>
        <textarea
          className="settings-input settings-textarea"
          value={bio}
          readOnly={!editing}
          onChange={(e) => setBio(e.target.value)}
          style={!editing ? { cursor: "default" } : {}}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        {!editing ? (
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>
            <Edit3 size={14} /> Edit Profile
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save</button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}><X size={14} /></button>
          </>
        )}
      </div>

      <div className="settings-section-title">System Preferences</div>

      {/* Storage row */}
      <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
        <Row icon={HardDrive} label="Storage & Data" sublabel={`${usedGB} GB used of ${totalGB} GB`}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{usedPct.toFixed(0)}%</span>
        </Row>
        <div className="storage-bar-track" style={{ width: "100%" }}>
          <div className="storage-bar-fill" style={{ width: `${usedPct}%` }} />
        </div>
      </div>

      {/* Appearance row */}
      <div className="settings-row">
        <div className="settings-row-left">
          <div className="settings-row-icon"><Palette size={16} /></div>
          <div className="settings-row-text"><p>Appearance</p></div>
        </div>
        <div className="theme-cards">
          {["Light", "Dark"].map((t) => {
            const isActive = (t === "Light") === (theme === "light");
            return (
              <div
                key={t}
                className={`theme-card ${isActive ? "active" : ""}`}
                onClick={() => setTheme(t === "Light" ? "light" : "dark")}
              >
                <div className={`theme-card-preview ${t === "Light" ? "light-preview" : "dark-preview"}`} />
                <span className="theme-card-label">{t}</span>
                <div className="theme-card-radio" />
              </div>
            );
          })}
        </div>
      </div>

      <Row icon={Bell} label="Push Notifications" sublabel="Get notified of new messages">
        <Toggle checked={desktopPush} onChange={(e) => setDesktopPush(e.target.checked)} />
      </Row>
      <Row icon={Check} label="Read Receipts" sublabel="Let others see when you've read messages">
        <Toggle checked={messagePreviews} onChange={(e) => setMessagePreviews(e.target.checked)} />
      </Row>
      <Row icon={Download} label="Auto-download Media" sublabel="Automatically save received files">
        <Toggle checked={false} onChange={() => {}} />
      </Row>

      {/* Footer version */}
      <div style={{ marginTop: 40, textAlign: "center", color: "var(--text-dim)" }}>
        <div style={{ fontSize: "1.4rem", marginBottom: 8, opacity: 0.5 }}>🚀</div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>ChatSphere for Web v2.4.0</div>
        <div style={{ fontSize: "0.72rem", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          End-to-End Encrypted
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Account
// ─────────────────────────────────────────
function AccountSection({ user }) {
  const { connected } = useSocket();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div>
      <div className="settings-section-title">Account Details</div>
      <div className="settings-row">
        <div className="settings-row-text" style={{ flex: 1 }}>
          <p>Email Address</p>
          <p>{user?.email || "—"}</p>
        </div>
      </div>
      <div className="settings-row">
        <div className="settings-row-text">
          <p>Connection Status</p>
          <p style={{ color: connected ? "var(--brand)" : "var(--error)" }}>
            {connected ? "● Connected" : "● Disconnected"}
          </p>
        </div>
      </div>

      <div className="settings-section-title" style={{ marginTop: 28 }}>Password</div>
      <div className="settings-field">
        <label>Current Password</label>
        <input type="password" className="settings-input" placeholder="••••••••" />
      </div>
      <div className="settings-field">
        <label>New Password</label>
        <input type="password" className="settings-input" placeholder="••••••••" />
      </div>
      <div className="settings-field">
        <label>Confirm New Password</label>
        <input type="password" className="settings-input" placeholder="••••••••" />
      </div>
      <button className="btn btn-primary" style={{ marginBottom: 32 }}>Update Password</button>

      <div className="settings-section-title" style={{ marginTop: 0 }}>Danger Zone</div>
      <div
        style={{
          background: "rgba(220,60,60,0.08)",
          border: "1px solid rgba(220,60,60,0.2)",
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Delete Account</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            This will permanently delete your account and all data.
          </p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
          Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" style={{ color: "var(--error)" }}>⚠ Delete Account</div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
              Are you sure? This action cannot be undone. All your messages, contacts, and data will be permanently erased.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Privacy
// ─────────────────────────────────────────
function PrivacySection() {
  const {
    ghostMode, setGhostMode,
    twoFactor, setTwoFactor,
    lastSeen, setLastSeen,
    profilePhoto, setProfilePhoto,
    about, setAbout,
    privacyStatus, setPrivacyStatus,
  } = useAuth();
  const opts = ["Everyone", "My Contacts", "Nobody"];

  return (
    <div>
      <div className="settings-section-title">Who Can See My Info</div>
      <Row icon={Eye}         label="Last Seen"     sublabel="Who sees your last active time">
        <Select value={lastSeen}     onChange={setLastSeen}     options={opts} />
      </Row>
      <Row icon={Image}       label="Profile Photo" sublabel="Who sees your profile picture">
        <Select value={profilePhoto} onChange={setProfilePhoto} options={opts} />
      </Row>
      <Row icon={Info}        label="About"         sublabel="Who sees your bio">
        <Select value={about}        onChange={setAbout}        options={opts} />
      </Row>
      <Row icon={MessageSquare} label="Status"      sublabel="Who sees your online status">
        <Select value={privacyStatus} onChange={setPrivacyStatus} options={opts} />
      </Row>

      <div className="settings-section-title">Security &amp; Modes</div>
      <Row icon={Settings} label="Ghost Mode" sublabel="Hide your online status across all channels.">
        <Toggle checked={ghostMode} onChange={(e) => setGhostMode(e.target.checked)} />
      </Row>
      <div className="settings-row">
        <div className="settings-row-left">
          <div className="settings-row-icon"><Shield size={16} /></div>
          <div className="settings-row-text">
            <p>
              Two-Factor Authentication
              <span className="badge-recommended">Recommended</span>
            </p>
            <p style={{ color: "var(--brand)", cursor: "pointer", marginTop: 3, fontSize: "0.78rem" }}>
              Change PIN
            </p>
          </div>
        </div>
        <Toggle checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
      </div>

      {/* E2E Encryption card */}
      <div className="e2e-card">
        <div className="e2e-card-icon"><Shield size={28} /></div>
        <div>
          <h4>End-to-End Encryption</h4>
          <p>All your personal chats and files are secured with military-grade encryption. Not even ChatSphere can read them.</p>
          <button className="e2e-card-btn">Learn More about Security</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Notifications
// ─────────────────────────────────────────
function NotificationsSection() {
  const { desktopPush, setDesktopPush, soundEffects, setSoundEffects, messagePreviews, setMessagePreviews } = useAuth();
  return (
    <div>
      <div className="settings-section-title">Notification Preferences</div>
      <Row icon={Bell} label="Desktop Push Notifications" sublabel="Show alerts when app is in background">
        <Toggle checked={desktopPush} onChange={(e) => setDesktopPush(e.target.checked)} />
      </Row>
      <Row icon={Settings} label="Sound Effects" sublabel="Play sounds for messages and events">
        <Toggle checked={soundEffects} onChange={(e) => setSoundEffects(e.target.checked)} />
      </Row>
      <Row icon={Eye} label="Message Previews" sublabel="Show content in notification banners">
        <Toggle checked={messagePreviews} onChange={(e) => setMessagePreviews(e.target.checked)} />
      </Row>
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Storage
// ─────────────────────────────────────────
function StorageSection() {
  const { storageUsed, setStorageUsed } = useAuth();
  const totalGB = 5;
  const usedGB = (storageUsed / 1024).toFixed(1);
  const usedPct = Math.min((storageUsed / (totalGB * 1024)) * 100, 100);

  const cats = [
    { label: "Photos & Videos", pct: 55, color: "var(--accent)" },
    { label: "Documents",       pct: 20, color: "var(--brand)" },
    { label: "Audio",           pct: 15, color: "var(--warning)" },
    { label: "Other",           pct: 10, color: "var(--text-dim)" },
  ];

  return (
    <div>
      <div className="settings-section-title">Storage Usage</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
          <span>{usedGB} GB used</span>
          <span>{totalGB} GB total</span>
        </div>
        <div className="storage-bar-track">
          <div className="storage-bar-fill" style={{ width: `${usedPct}%` }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {cats.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-main)" }}>{c.label}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {((storageUsed * c.pct / 100) / 1024).toFixed(2)} GB
            </span>
          </div>
        ))}
      </div>

      <div className="settings-section-title">Manage</div>
      <button className="btn btn-danger" onClick={() => setStorageUsed(0)}>Clear All Cache</button>
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Appearance
// ─────────────────────────────────────────
function AppearanceSection() {
  const { theme, setTheme } = useAuth();
  return (
    <div>
      <div className="settings-section-title">Theme</div>
      <div className="theme-cards">
        {[
          { id: "light", label: "Light", previewClass: "light-preview" },
          { id: "dark",  label: "Dark",  previewClass: "dark-preview" },
        ].map(({ id, label, previewClass }) => (
          <div
            key={id}
            className={`theme-card ${theme === id ? "active" : ""}`}
            onClick={() => setTheme(id)}
          >
            <div className={`theme-card-preview ${previewClass}`} />
            <span className="theme-card-label">{label}</span>
            <div className="theme-card-radio" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Section: Help
// ─────────────────────────────────────────
function HelpSection() {
  return (
    <div>
      <div className="settings-section-title">About ChatSphere</div>
      <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 20 }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🚀</div>
        <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>ChatSphere for Web v2.4.0</div>
        <div style={{ fontSize: "0.78rem", color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          End-to-End Encrypted
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          ChatSphere is a real-time messaging platform with support for direct messages, group chats, live location sharing, and more — all secured with end-to-end encryption.
        </p>
      </div>

      <div className="settings-section-title">Features</div>
      {[
        ["💬","Real-time messaging","Instant delivery via Socket.IO"],
        ["⌨️","Typing indicators","See when others are composing"],
        ["✓✓","Read receipts","Know when messages are read"],
        ["👥","Group chats","Create groups with multiple members"],
        ["📍","Live location sharing","Share your real-time location"],
        ["🗺️","Google Maps integration","View on an interactive map"],
      ].map(([icon, label, desc]) => (
        <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{icon}</span>
          <div>
            <p style={{ fontSize: "0.88rem", fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Main SettingsView
// ─────────────────────────────────────────
export default function SettingsView({ section = "profile", onChangeSection }) {
  const { user, updateProfile, logout } = useAuth();

  const sections = {
    profile:       <ProfileSection user={user} updateProfile={updateProfile} />,
    account:       <AccountSection user={user} />,
    privacy:       <PrivacySection />,
    notifications: <NotificationsSection />,
    storage:       <StorageSection />,
    appearance:    <AppearanceSection />,
    help:          <HelpSection />,
  };

  return (
    <div className="settings-area">
      {sections[section] || <HelpSection />}
    </div>
  );
}
