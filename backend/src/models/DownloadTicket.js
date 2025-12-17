const mongoose = require("mongoose");

const downloadTicketSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DownloadTicket", downloadTicketSchema);
