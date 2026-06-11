require("dotenv").config();
console.log("MONGODB_URI =", process.env.MONGODB_URI);
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("./db");


const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, { cors: corsOptions });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "chatsphere_default_secret_key";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

app.get("/api/config", (req, res) => {
  res.json({ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;

    const newUser = await db.createUser({ username, email, passwordHash, avatar });
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, avatar: newUser.avatar }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, photoURL } = req.body;

    let user = await db.getUserByEmail(email);

    if (!user) {
      user = await db.createUser({
        username: name,
        email,
        passwordHash: null,
        avatar: photoURL
      });

      console.log("NEW GOOGLE USER CREATED");
    } else {
      console.log("EXISTING GOOGLE USER");
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user
    });

  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await db.getAllUsers(req.user.id);
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await db.searchUsers(q, req.user.id);
    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/chats/:targetUserId/messages", authenticateToken, async (req, res) => {
  try {
    console.log("CURRENT USER:", req.user.id);
    console.log("TARGET USER:", req.params.targetUserId);
    const messages = await db.getMessages(req.user.id, req.params.targetUserId);
    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/groups", authenticateToken, async (req, res) => {
  try {
    const groups = await db.getGroups(req.user.id);
    res.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups", authenticateToken, async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    if (!name || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: "Group name and participants array are required" });
    }

    const participants = Array.from(new Set([req.user.id, ...participantIds]));
    const newGroup = await db.createGroup({ name, adminId: req.user.id, participants });
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/groups/:groupId/messages", authenticateToken, async (req, res) => {
  try {
    const messages = await db.getGroupMessages(req.params.groupId);
    res.json(messages);
  } catch (error) {
    console.error("Get group messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/messages/read", authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const updated = await db.markMessagesRead(messageIds, req.user.id);
    notifyReadReceipts(updated, req.user.id);
    res.json({ updated });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/locations", authenticateToken, async (req, res) => {
  try {
    const locations = await db.getLocations();
    res.json(locations);
  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Configure Multer for File Uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let type = "file";
    if (req.file.mimetype.startsWith("image/")) {
      type = "image";
    } else if (req.file.mimetype.startsWith("audio/")) {
      type = "audio";
    } else if (req.file.mimetype.startsWith("video/")) {
      type = "video";
    }

    res.status(200).json({
      url: `/uploads/${req.file.filename}`,
      type: type,
      name: req.file.originalname
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

const onlineUsers = new Map();

function notifyReadReceipts(messages, readerId) {
  const readAt = new Date();
  const bySender = {};

  messages.forEach((msg) => {
    if (!bySender[msg.senderId]) bySender[msg.senderId] = [];
    bySender[msg.senderId].push(msg.id);
  });

  Object.entries(bySender).forEach(([senderId, messageIds]) => {
    io.to(`user_${senderId}`).emit("messages_read", { messageIds, readerId, readAt });
    if (messages[0]?.groupId) {
      io.to(`group_${messages[0].groupId}`).emit("messages_read", { messageIds, readerId, readAt });
    }
  });
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Invalid token"));
    socket.user = user;
    next();
  });
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  socket.userId = userId;
  onlineUsers.set(userId, socket.id);
  socket.join(`user_${userId}`);
  socket.broadcast.emit("user_status", { userId, status: "online" });
  console.log(`User ${userId} connected (${socket.id})`);

  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on("send_private_message", async (data, callback) => {
    try {
      const { receiverId, content, type = "text" } = data;
      if (!receiverId || !content) {
        return callback?.({ error: "Missing required message parameters" });
      }

      const savedMsg = await db.saveMessage({ senderId: userId, receiverId, content, type });
      io.to(`user_${receiverId}`).emit("receive_private_message", savedMsg);
      callback?.({ success: true, message: savedMsg });
    } catch (err) {
      console.error("Socket private message error:", err);
      callback?.({ error: "Failed to send message" });
    }
  });

  socket.on("send_group_message", async (data, callback) => {
    try {
      const { groupId, content, type = "text" } = data;
      if (!groupId || !content) {
        return callback?.({ error: "Missing required message parameters" });
      }

      const savedMsg = await db.saveGroupMessage({ senderId: userId, groupId, content, type });
      io.to(`group_${groupId}`).emit("receive_group_message", savedMsg);
      callback?.({ success: true, message: savedMsg });
    } catch (err) {
      console.error("Socket group message error:", err);
      callback?.({ error: "Failed to send group message" });
    }
  });

  socket.on("mark_messages_read", async (data) => {
    try {
      const { messageIds } = data;
      if (!messageIds?.length) return;

      const updated = await db.markMessagesRead(messageIds, userId);
      notifyReadReceipts(updated, userId);
    } catch (err) {
      console.error("Mark messages read error:", err);
    }
  });

  socket.on("typing_status", (data) => {
    const { targetId, isGroup, isTyping } = data;
    if (!targetId) return;

    if (isGroup) {
      socket.to(`group_${targetId}`).emit("typing_status", { senderId: userId, groupId: targetId, isGroup: true, isTyping });
    } else {
      socket.to(`user_${targetId}`).emit("typing_status", { senderId: userId, isGroup: false, isTyping });
    }
  });

  socket.on("send_private_location", async (data, callback) => {
    try {
      const { receiverId, lat, lng } = data;
      if (!receiverId || lat === undefined || lng === undefined) {
        return callback?.({ error: "Missing location or receiver data" });
      }

      const savedMsg = await db.saveMessage({
        senderId: userId,
        receiverId,
        content: "📍 Shared live location",
        type: "location",
        location: { lat, lng }
      });

      io.to(`user_${receiverId}`).emit("receive_private_message", savedMsg);
      callback?.({ success: true, message: savedMsg });
    } catch (err) {
      console.error("Socket private location error:", err);
      callback?.({ error: "Failed to share location" });
    }
  });

  socket.on("location_update", async (data) => {
    const { lat, lng } = data;
    if (lat === undefined || lng === undefined) return;

    try {
      const locData = await db.updateLocation(userId, { lat, lng });
      io.emit("location_updated", { userId, lat: locData.lat, lng: locData.lng, timestamp: locData.timestamp });
    } catch (err) {
      console.error("Location update error:", err);
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    socket.broadcast.emit("user_status", { userId, status: "offline" });
    console.log(`User ${userId} disconnected`);
  });
});

const frontendDist = path.join(__dirname, "../frontend/dist");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io") || req.path.startsWith("/uploads")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

async function start() {
  try {
    await db.connectDB();
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Run: npm run restart`);
        process.exit(1);
      }
      throw err;
    });

    server.listen(PORT, () => {
      console.log(`ChatSphere API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    console.error("Make sure MongoDB is running at:", process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatsphere");
    process.exit(1);
  }
}

start();
