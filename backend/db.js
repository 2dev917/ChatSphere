const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Message = require("./models/Message");
const Group = require("./models/Group");
const Location = require("./models/Location");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatsphere";

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatsphere";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log("MongoDB connected:", uri);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  await seedDatabase();
}
async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await User.create({
    username: "alice",
    email: "alice@example.com",
    passwordHash,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=alice"
  });

  const bob = await User.create({
    username: "bob",
    email: "bob@example.com",
    passwordHash,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=bob"
  });

  await Group.create({
    name: "Study Group",
    adminId: alice._id,
    participants: [alice._id, bob._id]
  });

  await Location.create({ userId: alice._id, lat: 37.7749, lng: -122.4194 });
  await Location.create({ userId: bob._id, lat: 37.7849, lng: -122.4094 });

  console.log("Seeded demo users: alice@example.com / bob@example.com (password123)");
}

const dbAPI = {
  createUser: async (userData) => {
    const user = await User.create(userData);
    return user.toPublic();
  },

  getUserByEmail: async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return null;
    return { ...user.toPublic(), passwordHash: user.passwordHash };
  },

  getUserById: async (id) => {
    const user = await User.findById(id);
    return user ? user.toPublic() : null;
  },

  searchUsers: async (query, currentUserId) => {
    const q = query.toLowerCase();
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    }).limit(20);
    return users.map((u) => u.toPublic());
  },

  getAllUsers: async (currentUserId) => {
    const users = await User.find({ _id: { $ne: currentUserId } });
    return users.map((u) => u.toPublic());
  },

  saveMessage: async (msgData) => {
    const msg = await Message.create({
      senderId: msgData.senderId,
      receiverId: msgData.receiverId,
      content: msgData.content,
      type: msgData.type || "text",
      location: msgData.location
    });
    return msg.toJSON();
  },

  getMessages: async (user1, user2) => {
    const messages = await Message.find({
      groupId: { $exists: false },
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ createdAt: 1 });
    return messages.map((m) => m.toJSON());
  },

  createGroup: async (groupData) => {
    const group = await Group.create(groupData);
    return group.toJSON();
  },

  getGroups: async (userId) => {
    const groups = await Group.find({ participants: userId });
    return groups.map((g) => g.toJSON());
  },

  saveGroupMessage: async (msgData) => {
    const msg = await Message.create({
      senderId: msgData.senderId,
      groupId: msgData.groupId,
      content: msgData.content,
      type: msgData.type || "text"
    });
    return msg.toJSON();
  },

  getGroupMessages: async (groupId) => {
    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    return messages.map((m) => m.toJSON());
  },

  markMessagesRead: async (messageIds, readerId) => {
    const now = new Date();
    const messages = await Message.find({ _id: { $in: messageIds } });
    const updated = [];

    for (const msg of messages) {
      const alreadyRead = msg.readBy.some((r) => r.userId.toString() === readerId);
      if (!alreadyRead) {
        msg.readBy.push({ userId: readerId, readAt: now });
        await msg.save();
      }
      updated.push(msg.toJSON());
    }

    return updated;
  },

  updateLocation: async (userId, locationData) => {
    const loc = await Location.findOneAndUpdate(
      { userId },
      { lat: locationData.lat, lng: locationData.lng },
      { upsert: true, new: true }
    );
    return { lat: loc.lat, lng: loc.lng, timestamp: loc.updatedAt };
  },

  getLocations: async () => {
    const locations = await Location.find();
    const result = {};
    locations.forEach((loc) => {
      result[loc.userId.toString()] = {
        lat: loc.lat,
        lng: loc.lng,
        timestamp: loc.updatedAt
      };
    });
    return result;
  }
};

module.exports = { connectDB, ...dbAPI };
