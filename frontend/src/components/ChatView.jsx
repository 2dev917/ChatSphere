import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiFetch } from "../api";
import {
  Phone, Video, Pin, UserPlus, Search, HelpCircle,
  Paperclip, Smile, Send, MapPin, Mic, Square, Trash2
} from "lucide-react";

const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😅","🙌","👍","❤️","🔥","✨","🎉","😭","🤯","👀","💯","🚀","🌟","💬","😊","🫡","🤝","👋","💪","🎯","⚡","🌈"];

function AvatarEl({ src, name, size = 36 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--bg-tertiary)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.38, color: "var(--text-muted)",
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

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const diff = today.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function MessageRow({ message, isOutgoing, senderName, isGroup, currentUserId, chatPartnerId, allUsers }) {
  const isLocation = message.type === "location" && message.location;
  const readBy = message.readBy || [];

  const getCheckIcon = () => {
    if (!isOutgoing) return null;
    const partnerRead = isGroup
      ? readBy.filter((r) => r.userId !== currentUserId).length > 0
      : readBy.some((r) => r.userId === chatPartnerId);
    return (
      <span style={{ fontSize: "0.7rem", color: partnerRead ? "var(--brand)" : "rgba(255,255,255,0.5)" }}>
        {partnerRead ? "✓✓" : "✓"}
      </span>
    );
  };

  const isMedia = message.type === "image" || message.type === "video";

  return (
    <div className={`message-row ${isOutgoing ? "outgoing" : ""}`}>
      {!isOutgoing && (
        <div className="msg-avatar">
          <AvatarEl
            src={allUsers?.find((u) => u.id === message.senderId)?.avatar}
            name={senderName}
            size={36}
          />
        </div>
      )}
      <div className="msg-body">
        {isGroup && !isOutgoing && senderName && (
          <div className="msg-sender">{senderName}</div>
        )}
        <div
          className={`msg-bubble ${isOutgoing ? "outgoing" : "incoming"}`}
          style={isMedia ? { padding: 4, overflow: "hidden", borderRadius: "14px" } : {}}
        >
          {isLocation ? (
            <div>
              <div style={{ marginBottom: 4 }}>{message.content}</div>
              <a
                href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: isOutgoing ? "rgba(255,255,255,0.85)" : "var(--brand)", fontSize: "0.82rem", fontWeight: 600 }}
              >
                📍 Open location
              </a>
            </div>
          ) : message.type === "image" ? (
            <div className="msg-media-container">
              <img
                src={message.content}
                alt="Image attachment"
                className="msg-media-image"
                onClick={() => window.open(message.content, "_blank")}
              />
            </div>
          ) : message.type === "video" ? (
            <div className="msg-media-container">
              <video
                src={message.content}
                controls
                className="msg-media-video"
              />
            </div>
          ) : message.type === "audio" ? (
            <div className="msg-media-container" style={{ minWidth: "220px", padding: "4px 0" }}>
              <audio
                src={message.content}
                controls
                className="msg-media-audio"
              />
            </div>
          ) : message.type === "file" ? (
            <div className="msg-file-container">
              <Paperclip size={16} style={{ flexShrink: 0 }} />
              <a
                href={message.content}
                download
                target="_blank"
                rel="noreferrer"
                style={{ color: "inherit", textDecoration: "underline", wordBreak: "break-all", fontSize: "0.88rem" }}
              >
                {message.content.split("/").pop().substring(13) || "Attachment"}
              </a>
            </div>
          ) : (
            message.content
          )}
        </div>
        <div className="msg-meta">
          <span>{formatTime(message.timestamp)}</span>
          {getCheckIcon()}
        </div>
      </div>
    </div>
  );
}

export default function ChatView({ activeChat, users = [], onOpenMap }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareError, setShareError] = useState("");
  
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeChat) return;
    const path = activeChat.isGroup
      ? `/api/groups/${activeChat.id}/messages`
      : `/api/chats/${activeChat.id}/messages`;
    const data = await apiFetch(path);
    setMessages(data);
    markUnreadAsRead(data);
  }, [activeChat]);

  const markUnreadAsRead = (msgs) => {
    if (!socket || !activeChat) return;
    const unread = msgs
      .filter((m) => m.senderId !== user.id && !m.readBy?.some((r) => r.userId === user.id))
      .map((m) => m.id);
    if (unread.length) socket.emit("mark_messages_read", { messageIds: unread });
  };

  useEffect(() => {
    if (!activeChat) { setMessages([]); return; }
    loadMessages();
    if (activeChat.isGroup && socket) socket.emit("join_group", activeChat.id);
  }, [activeChat, loadMessages, socket]);

  useEffect(() => {
    if (!socket || !activeChat) return;

    const onPrivate = (msg) => {
      if (!activeChat.isGroup && (msg.senderId === activeChat.id || msg.receiverId === activeChat.id)) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId !== user.id) socket.emit("mark_messages_read", { messageIds: [msg.id] });
      }
    };
    const onGroup = (msg) => {
      if (activeChat.isGroup && msg.groupId === activeChat.id) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId !== user.id) socket.emit("mark_messages_read", { messageIds: [msg.id] });
      }
    };
    const onTyping = (data) => {
      if (activeChat.isGroup && data.groupId === activeChat.id && data.senderId !== user.id)
        setTypingUser(data.isTyping ? data.senderId : null);
      else if (!activeChat.isGroup && data.senderId === activeChat.id)
        setTypingUser(data.isTyping ? data.senderId : null);
    };
    const onRead = ({ messageIds, readerId, readAt }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (!messageIds.includes(m.id)) return m;
          const readBy = [...(m.readBy || [])];
          if (!readBy.some((r) => r.userId === readerId)) readBy.push({ userId: readerId, readAt });
          return { ...m, readBy };
        })
      );
    };

    socket.on("receive_private_message", onPrivate);
    socket.on("receive_group_message", onGroup);
    socket.on("typing_status", onTyping);
    socket.on("messages_read", onRead);
    return () => {
      socket.off("receive_private_message", onPrivate);
      socket.off("receive_group_message", onGroup);
      socket.off("typing_status", onTyping);
      socket.off("messages_read", onRead);
    };
  }, [socket, activeChat, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const getUserName = (id) => {
    if (id === user.id) return user.username;
    return users.find((u) => u.id === id)?.username || "User";
  };

  const sendTyping = () => {
    if (!socket || !activeChat) return;
    socket.emit("typing_status", { targetId: activeChat.id, isGroup: activeChat.isGroup, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_status", { targetId: activeChat.id, isGroup: activeChat.isGroup, isTyping: false });
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !activeChat) return;
    const content = input.trim();
    setInput("");
    setShowEmoji(false);
    if (activeChat.isGroup) {
      socket.emit("send_group_message", { groupId: activeChat.id, content }, (res) => {
        if (res?.message) setMessages((prev) => [...prev, res.message]);
      });
    } else {
      socket.emit("send_private_message", { receiverId: activeChat.id, content }, (res) => {
        if (res?.message) setMessages((prev) => [...prev, res.message]);
      });
    }
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) { setInput((prev) => prev + emoji); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const shareLocation = () => {
    if (!navigator.geolocation) { setShareError("Geolocation not supported."); return; }
    if (!socket || !activeChat || activeChat.isGroup) { setShareError("Can only share location in DMs."); return; }
    setShareStatus("Requesting location…"); setShareError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socket.emit("send_private_location", { receiverId: activeChat.id, lat: pos.coords.latitude, lng: pos.coords.longitude }, (res) => {
          if (res?.error) { setShareError(res.error); setShareStatus(""); }
          else if (res?.message) { setMessages((prev) => [...prev, res.message]); setShareStatus("Location shared!"); setTimeout(() => setShareStatus(""), 3000); }
        });
      },
      (err) => { setShareError(err.message); setShareStatus(""); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Recording and Uploading Helpers
  const startRecording = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setShareError("Voice recording is not supported in this browser.");
      setTimeout(() => setShareError(""), 5000);
      return;
    }

    audioChunksRef.current = [];
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (!isCancelledRef.current) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const audioFile = new File([audioBlob], `voice-recording-${Date.now()}.webm`, { type: "audio/webm" });
            uploadAndSendFile(audioFile, "audio");
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        isCancelledRef.current = false;

        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      })
      .catch((err) => {
        console.error("Microphone access error:", err);
        setShareError("Could not access microphone: " + err.message);
        setTimeout(() => setShareError(""), 5000);
      });
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(recordingIntervalRef.current);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    isCancelledRef.current = true;
    clearInterval(recordingIntervalRef.current);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const uploadAndSendFile = async (file, forcedType = null) => {
    if (!socket || !activeChat) return;

    setShareStatus("Uploading file...");
    setShareError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const fileUrl = data.url;
      const fileType = forcedType || data.type || "file";

      setShareStatus("Sending attachment...");

      const messagePayload = {
        content: fileUrl,
        type: fileType,
      };

      if (activeChat.isGroup) {
        socket.emit("send_group_message", { groupId: activeChat.id, ...messagePayload }, (res) => {
          if (res?.message) {
            setMessages((prev) => [...prev, res.message]);
            setShareStatus("");
          } else if (res?.error) {
            setShareError(res.error);
            setShareStatus("");
          }
        });
      } else {
        socket.emit("send_private_message", { receiverId: activeChat.id, ...messagePayload }, (res) => {
          if (res?.message) {
            setMessages((prev) => [...prev, res.message]);
            setShareStatus("");
          } else if (res?.error) {
            setShareError(res.error);
            setShareStatus("");
          }
        });
      }
    } catch (err) {
      console.error("Upload or send error:", err);
      setShareError(err.message || "Failed to upload or send attachment");
      setShareStatus("");
      setTimeout(() => setShareError(""), 5000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAndSendFile(file);
    e.target.value = ""; // Reset
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = formatDate(msg.timestamp);
    if (d !== lastDate) { groupedMessages.push({ type: "divider", label: d }); lastDate = d; }
    groupedMessages.push({ type: "message", msg });
  });

  if (!activeChat) {
    return (
      <div className="welcome-state">
        <div className="welcome-state-icon">💬</div>
        <h2>Welcome to ChatSphere</h2>
        <p>Select a conversation from the sidebar to start messaging, or create a new group to get started.</p>
      </div>
    );
  }

  const chatUser = users.find((u) => u.id === activeChat.id);
  const { onlineUsers } = useSocket();
const isOnline = onlineUsers.has(activeChat.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--bg-secondary)",
                overflow: "hidden", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              {activeChat.avatar
                ? <img src={activeChat.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : activeChat.name[0].toUpperCase()
              }
            </div>
            {!activeChat.isGroup && chatUser && isOnline && (
  <span
    style={{
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--success)",
      border: "2px solid var(--bg-primary)",
    }}
  />
)}
          </div>
          <div>
            <div className="chat-header-name">{activeChat.name}</div>
            <div className="chat-header-sub">
  {activeChat.isGroup ? (
    <span>Group chat</span>
  ) : isOnline ? (
    <>
      <span className="online-dot" />
      Online
    </>
  ) : (
    "Offline"
  )}
</div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="hdr-btn" title="Voice Call"><Phone size={18} /></button>
          <button className="hdr-btn" title="Video Call"><Video size={18} /></button>
          {!activeChat.isGroup && (
            <button className="hdr-btn" title="Share Location" onClick={shareLocation}>
              <MapPin size={18} />
            </button>
          )}
          <button className="hdr-btn" title="View Map" onClick={onOpenMap}><Pin size={18} /></button>
          <button className="hdr-btn" title="Add Members"><UserPlus size={18} /></button>
          <div className="hdr-sep" />
          <button className="hdr-btn" title="Search"><Search size={18} /></button>
          <button className="hdr-btn" title="Help"><HelpCircle size={18} /></button>
        </div>
      </div>

      {/* Status toasts */}
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

      {/* Messages */}
      <div className="chat-messages">
        {groupedMessages.map((item, i) =>
          item.type === "divider" ? (
            <div key={`d-${i}`} className="date-divider">{item.label}</div>
          ) : (
            <MessageRow
              key={item.msg.id || i}
              message={item.msg}
              isOutgoing={item.msg.senderId === user.id}
              senderName={getUserName(item.msg.senderId)}
              isGroup={activeChat.isGroup}
              currentUserId={user.id}
              chatPartnerId={activeChat.isGroup ? null : activeChat.id}
              allUsers={users}
            />
          )
        )}
        {typingUser && (
          <div className="typing-row">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span>{getUserName(typingUser)} is typing…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="emoji-picker-popup">
          {EMOJIS.map((e) => (
            <button key={e} className="emoji-btn" onClick={() => insertEmoji(e)}>{e}</button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="message-input-bar">
        <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <div className="msg-input-wrap">
          {isRecording ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "5px 0" }}>
              <span className="recording-dot" />
              <span style={{ color: "var(--error)", fontWeight: 600, fontSize: "0.88rem" }}>Recording Voice...</span>
              <span style={{ color: "var(--text-main)", fontVariantNumeric: "tab-regular", fontSize: "0.88rem", fontWeight: 700, marginLeft: "4px" }}>
                {formatDuration(recordingDuration)}
              </span>
              <div style={{ flex: 1 }} />
              <button className="input-icon-btn" title="Cancel Recording" onClick={cancelRecording} style={{ color: "var(--error)" }}>
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <>
              <button className="input-icon-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={18} />
              </button>
              <input
                ref={inputRef}
                placeholder={`Message @${activeChat.name}…`}
                value={input}
                onChange={(e) => { setInput(e.target.value); sendTyping(); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
              />
              <button
                className="input-icon-btn"
                title="Emoji"
                onClick={() => setShowEmoji((v) => !v)}
                style={showEmoji ? { color: "var(--brand)" } : {}}
              >
                <Smile size={18} />
              </button>
              <button
                className="input-icon-btn"
                title="Record Audio"
                onClick={startRecording}
              >
                <Mic size={18} />
              </button>
            </>
          )}
        </div>
        {isRecording ? (
          <button className="send-btn" onClick={stopRecording} title="Send Recording">
            <Send size={18} />
          </button>
        ) : (
          <button className="send-btn" onClick={handleSend} title="Send">
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
