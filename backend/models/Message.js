const mongoose = require("mongoose");

const readReceiptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    content: { type: String, required: true },
    type: { type: String, default: "text" },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    readBy: { type: [readReceiptSchema], default: [] }
  },
  { timestamps: true }
);

messageSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    senderId: this.senderId.toString(),
    receiverId: this.receiverId ? this.receiverId.toString() : undefined,
    groupId: this.groupId ? this.groupId.toString() : undefined,
    content: this.content,
    type: this.type,
    location: this.location ? { lat: this.location.lat, lng: this.location.lng } : undefined,
    readBy: this.readBy.map((r) => ({
      userId: r.userId.toString(),
      readAt: r.readAt
    })),
    timestamp: this.createdAt
  };
};

module.exports = mongoose.model("Message", messageSchema);
