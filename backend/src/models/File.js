const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    shareLinks: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, default: null }, // null => never expires
        createdAt: { type: Date, default: Date.now },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
    },

    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
