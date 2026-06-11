import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiFetch } from "../api";
import { MapPin } from "lucide-react";

function AvatarEl({ src, name, size = 34 }) {
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

export default function MapView({ users, activeChat }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [locations, setLocations] = useState({});
  const [mapsKey, setMapsKey] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareError, setShareError] = useState("");
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    apiFetch("/api/config").then((c) => {
      if (c.googleMapsApiKey && c.googleMapsApiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
        setMapsKey(c.googleMapsApiKey);
        loadGoogleMaps(c.googleMapsApiKey);
      }
    }).catch(() => {});
    apiFetch("/api/locations").then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onLoc = ({ userId, lat, lng, timestamp }) => {
      setLocations((prev) => ({ ...prev, [userId]: { lat, lng, timestamp } }));
    };
    socket.on("location_updated", onLoc);
    return () => socket.off("location_updated", onLoc);
  }, [socket]);

  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;
    updateMarkers();
  }, [locations, users, mapReady]);

  const loadGoogleMaps = (key) => {
    if (window.google?.maps) { initMap(); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  };

  const initMap = () => {
    if (!mapRef.current || !window.google) return;
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d2230" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1d2230" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8994a5" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b3344" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#111827" }] },
      ],
    });
    setMapReady(true);
  };

  const updateMarkers = () => {
    const map = googleMapRef.current;
    if (!map) return;
    Object.entries(locations).forEach(([userId, loc]) => {
      const u = users.find((x) => x.id === userId) || (userId === user.id ? user : null);
      if (!u) return;
      const pos = { lat: loc.lat, lng: loc.lng };
      if (markersRef.current[userId]) {
        markersRef.current[userId].setPosition(pos);
      } else {
        markersRef.current[userId] = new window.google.maps.Marker({ map, position: pos, title: u.username });
      }
    });
  };

  const shareLocation = () => {
    if (!navigator.geolocation) { setShareError("Geolocation not supported."); return; }
    if (!socket) { setShareError("Not connected to server."); return; }
    setShareStatus("Requesting location…"); setShareError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socket.emit("location_update", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShareStatus("Location shared!"); setTimeout(() => setShareStatus(""), 3000);
      },
      (err) => { setShareError(err.message); setShareStatus(""); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <MapPin size={20} style={{ color: "var(--brand)" }} />
          <div>
            <div className="chat-header-name">Live Locations</div>
            <div className="chat-header-sub">{Object.keys(locations).length} sharing</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={shareLocation}>
          <MapPin size={16} /> Share My Location
        </button>
      </div>

      {/* Status */}
      {shareStatus && (
        <div style={{ padding: "8px 20px", background: "rgba(0,194,97,0.1)", borderBottom: "1px solid rgba(0,194,97,0.2)", color: "var(--brand)", fontSize: "0.82rem" }}>
          ✓ {shareStatus}
        </div>
      )}
      {shareError && (
        <div style={{ padding: "8px 20px", background: "rgba(220,60,60,0.1)", borderBottom: "1px solid rgba(220,60,60,0.2)", color: "var(--error)", fontSize: "0.82rem" }}>
          ✕ {shareError}
        </div>
      )}

      {/* Map + list */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>
        {/* Map canvas */}
        <div style={{ flex: 1, position: "relative", background: "var(--bg-secondary)" }}>
          {mapsKey ? (
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
              {/* Grid overlay mock */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Markers */}
              <div style={{ position: "absolute", inset: 0 }}>
                {Object.entries(locations).map(([userId, loc]) => {
                  const u = users.find((x) => x.id === userId) || (userId === user.id ? user : null);
                  if (!u) return null;
                  return (
                    <div
                      key={userId}
                      style={{
                        position: "absolute",
                        left: `${((loc.lng + 122.5) / 245) * 100}%`,
                        top: `${((38 - loc.lat) / 76) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <div style={{ outline: "3px solid var(--brand)", borderRadius: "50%", boxShadow: "0 0 0 6px var(--brand-glow)" }}>
                        <AvatarEl src={u.avatar} name={u.username} size={36} />
                      </div>
                      <div style={{
                        background: "var(--bg-primary)", borderRadius: 999, padding: "3px 8px",
                        fontSize: "0.7rem", fontWeight: 600, border: "1px solid var(--border)",
                        whiteSpace: "nowrap",
                      }}>
                        {u.username}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", fontSize: "0.75rem", color: "var(--text-dim)", background: "var(--bg-primary)", padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border)" }}>
                Add a Google Maps API key in <code style={{ color: "var(--brand)" }}>backend/.env</code> for the real map
              </div>
            </div>
          )}
        </div>

        {/* Location list sidebar */}
        <div style={{ width: 240, borderLeft: "1px solid var(--border)", overflowY: "auto", background: "var(--bg-secondary)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="right-panel-heading">Sharing Now</div>
          </div>
          {Object.keys(locations).length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.82rem" }}>
              <MapPin size={28} style={{ opacity: 0.3, margin: "0 auto 10px", display: "block" }} />
              No shared locations yet
            </div>
          ) : (
            Object.entries(locations).map(([userId, loc]) => {
              const u = users.find((x) => x.id === userId) || (userId === user.id ? user : null);
              if (!u) return null;
              return (
                <div key={userId} className="member-item" style={{ borderBottom: "1px solid var(--border)", padding: "12px 14px" }}>
                  <AvatarEl src={u.avatar} name={u.username} size={34} />
                  <div>
                    <div className="member-name">{u.username}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "monospace" }}>
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
