const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { timestamps: true }
);

locationSchema.methods.toJSON = function () {
  return {
    lat: this.lat,
    lng: this.lng,
    timestamp: this.updatedAt
  };
};

module.exports = mongoose.model("Location", locationSchema);
