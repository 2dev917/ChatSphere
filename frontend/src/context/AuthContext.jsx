import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      displayName: parsed.displayName || parsed.username || "Alex",
      bio: parsed.bio || "Senior UI/UX Designer at ChatSphere. Passionate about minimalist aesthetics and functional precision. 🛠️✨"
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Settings Toggles State
  const [ghostMode, setGhostMode] = useState(() => localStorage.getItem("ghostMode") === "true");
  const [twoFactor, setTwoFactor] = useState(() => localStorage.getItem("twoFactor") !== "false"); // default true
  const [desktopPush, setDesktopPush] = useState(() => localStorage.getItem("desktopPush") !== "false"); // default true
  const [soundEffects, setSoundEffects] = useState(() => localStorage.getItem("soundEffects") !== "false"); // default true
  const [messagePreviews, setMessagePreviews] = useState(() => localStorage.getItem("messagePreviews") !== "false"); // default true

  // Privacy dropdowns
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem("lastSeen") || "Everyone");
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem("profilePhoto") || "My Contacts");
  const [about, setAbout] = useState(() => localStorage.getItem("about") || "Nobody");
  const [privacyStatus, setPrivacyStatus] = useState(() => localStorage.getItem("privacyStatus") || "My Contacts");

  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // Storage Used (in MB)
  const [storageUsed, setStorageUsed] = useState(() => {
    const val = localStorage.getItem("storageUsed");
    return val !== null ? parseInt(val, 10) : 1228; // default 1.2 GB (1228 MB)
  });

  // Contacts & Calls lists
  const [contacts, setContacts] = useState(() => {
    const val = localStorage.getItem("contacts");
    return val ? JSON.parse(val) : [
      { id: "c1", name: "Alice Brown", email: "alice@example.com", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=alice", initial: "A" },
      { id: "c2", name: "Bob Wilson", email: "bob@example.com", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=bob", initial: "B" },
      { id: "c3", name: "Charlie Davis", email: "charlie@example.com", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=charlie", initial: "C" }
    ];
  });

  const [calls, setCalls] = useState(() => {
    const val = localStorage.getItem("calls");
    return val ? JSON.parse(val) : [
      { id: "ca1", name: "Alice Brown", type: "Missed", timestamp: "10:42 AM", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=alice" },
      { id: "ca2", name: "Bob Wilson", type: "Incoming", timestamp: "Yesterday", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=bob" }
    ];
  });

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.body.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync helpers to localStorage
  useEffect(() => {
    localStorage.setItem("ghostMode", ghostMode);
  }, [ghostMode]);

  useEffect(() => {
    localStorage.setItem("twoFactor", twoFactor);
  }, [twoFactor]);

  useEffect(() => {
    localStorage.setItem("desktopPush", desktopPush);
  }, [desktopPush]);

  useEffect(() => {
    localStorage.setItem("soundEffects", soundEffects);
  }, [soundEffects]);

  useEffect(() => {
    localStorage.setItem("messagePreviews", messagePreviews);
  }, [messagePreviews]);

  useEffect(() => {
    localStorage.setItem("lastSeen", lastSeen);
  }, [lastSeen]);

  useEffect(() => {
    localStorage.setItem("profilePhoto", profilePhoto);
  }, [profilePhoto]);

  useEffect(() => {
    localStorage.setItem("about", about);
  }, [about]);

  useEffect(() => {
    localStorage.setItem("privacyStatus", privacyStatus);
  }, [privacyStatus]);

  useEffect(() => {
    localStorage.setItem("storageUsed", storageUsed);
  }, [storageUsed]);

  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("calls", JSON.stringify(calls));
  }, [calls]);

  const saveAuth = (newToken, newUser) => {
    const mergedUser = {
      ...newUser,
      displayName: newUser.displayName || newUser.username || "Alex",
      bio: newUser.bio || "Senior UI/UX Designer at ChatSphere. Passionate about minimalist aesthetics and functional precision. 🛠️✨"
    };
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(mergedUser));
    setToken(newToken);
    setUser(mergedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    saveAuth(data.token, data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password })
    });
    saveAuth(data.token, data.user);
    return data;
  };

  const updateProfile = (displayName, username, bio) => {
    if (!user) return;
    const updated = { ...user, displayName, username, bio };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  const addContact = (name, email) => {
    const newContact = {
      id: "c_" + Date.now(),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      initial: name.trim()[0]?.toUpperCase() || "C"
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const addCall = (name, type = "Outgoing", avatar) => {
    const newCall = {
      id: "ca_" + Date.now(),
      name,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
    };
    setCalls((prev) => [newCall, ...prev]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        saveAuth,
        logout,
        isAuthenticated: !!token && !!user,
        updateProfile,

        // Settings toggles
        ghostMode,
        setGhostMode,
        twoFactor,
        setTwoFactor,
        desktopPush,
        setDesktopPush,
        soundEffects,
        setSoundEffects,
        messagePreviews,
        setMessagePreviews,

        // Privacy selections
        lastSeen,
        setLastSeen,
        profilePhoto,
        setProfilePhoto,
        about,
        setAbout,
        privacyStatus,
        setPrivacyStatus,

        // Theme and Storage
        theme,
        setTheme,
        storageUsed,
        setStorageUsed,

        // Custom lists
        contacts,
        addContact,
        calls,
        addCall
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

