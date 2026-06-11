const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

groupSchema.methods.toJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    adminId: this.adminId.toString(),
    participants: this.participants.map((p) => p.toString()),
    created_at: this.createdAt
  };
};

module.exports = mongoose.model("Group", groupSchema);
