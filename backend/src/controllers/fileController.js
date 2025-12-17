const axios = require("axios");
const { nanoid } = require("nanoid");
const DownloadTicket = require("../models/DownloadTicket");

const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const File = require("../models/File");

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const isImage = req.file.mimetype?.startsWith("image/");
    const resourceType = isImage ? "image" : "raw"; // PDFs, docs → raw

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "drive-clone",
      resource_type: resourceType,
    });

    const doc = await File.create({
      owner: req.user._id,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl: result.secure_url,
      resourceType: result.resource_type,
      uploadedAt: new Date(),
    });

    return res.status(201).json({
      message: "Uploaded",
      file: doc,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Upload failed",
      error: err.message,
    });
  }
};

exports.uploadBulk = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const created = [];

    for (const f of req.files) {
      const isImage = f.mimetype?.startsWith("image/");
      const resourceType = isImage ? "image" : "raw";

      const result = await uploadBufferToCloudinary(f.buffer, {
        folder: "drive-clone",
        resource_type: resourceType,
      });

      const doc = await File.create({
        owner: req.user._id,
        filename: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        cloudinaryPublicId: result.public_id,
        cloudinaryUrl: result.secure_url,
        resourceType: result.resource_type,
        uploadedAt: new Date(),
      });

      created.push(doc);
    }

    return res.status(201).json({
      message: "Bulk upload successful",
      files: created,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Bulk upload failed",
      error: err.message,
    });
  }
};

exports.listMyFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .select("filename mimeType size uploadedAt cloudinaryUrl createdAt");

    res.json({ files });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch files", error: err.message });
  }
};

exports.shareWithUsers = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ message: "emails must be a non-empty array" });
    }

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only owner can share this file" });
    }

    const users = await User.find({
      email: { $in: emails.map((e) => e.toLowerCase()) },
    }).select("_id email");

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No valid users found for given emails" });
    }

    const userIds = users.map((u) => u._id.toString());

    const current = new Set((file.sharedWith || []).map((id) => id.toString()));
    userIds.forEach((id) => current.add(id));

    file.sharedWith = Array.from(current);
    await file.save();

    return res.json({
      message: "File shared",
      sharedWith: users.map((u) => u.email),
      fileId: file._id,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Share failed", error: err.message });
  }
};

exports.listSharedWithMe = async (req, res) => {
  try {
    const files = await File.find({ sharedWith: req.user._id })
      .sort({ createdAt: -1 })
      .select(
        "filename mimeType size uploadedAt cloudinaryUrl owner createdAt"
      );

    res.json({ files });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch shared files", error: err.message });
  }
};

function canAccessFile(file, userId) {
  const uid = userId.toString();
  if (file.owner.toString() === uid) return true;
  if ((file.sharedWith || []).some((id) => id.toString() === uid)) return true;
  return false;
}

exports.getFileMeta = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId).select(
      "owner sharedWith filename mimeType size uploadedAt cloudinaryUrl createdAt"
    );

    if (!file) return res.status(404).json({ message: "File not found" });

    if (!canAccessFile(file, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({
      file: {
        id: file._id,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.uploadedAt,
        createdAt: file.createdAt,
      },
      downloadUrl: `/api/files/${file._id}/download`,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch file", error: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId).select(
      "owner sharedWith cloudinaryUrl filename"
    );

    if (!file) return res.status(404).json({ message: "File not found" });

    if (!canAccessFile(file, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.redirect(file.cloudinaryUrl);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Download failed", error: err.message });
  }
};

// Owner creates share link with expiry (minutes)
exports.createShareLink = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiresInMinutes } = req.body; // optional

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only owner can create share link" });
    }

    const token = nanoid(32);

    let expiresAt = null;
    if (expiresInMinutes !== undefined && expiresInMinutes !== null) {
      const mins = Number(expiresInMinutes);
      if (!Number.isFinite(mins) || mins <= 0) {
        return res
          .status(400)
          .json({ message: "expiresInMinutes must be a positive number" });
      }
      expiresAt = new Date(Date.now() + mins * 60 * 1000);
    }

    file.shareLinks = file.shareLinks || [];
    file.shareLinks.push({
      token,
      expiresAt,
      createdBy: req.user._id,
      createdAt: new Date(),
    });

    await file.save();

    return res.status(201).json({
      message: "Share link created",
      shareUrl: `/api/share/${token}`, // backend path
      token,
      expiresAt,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to create share link", error: err.message });
  }
};

exports.accessViaShareLink = async (req, res) => {
  try {
    const { token } = req.params;

    const file = await File.findOne({ "shareLinks.token": token }).select(
      "owner sharedWith shareLinks cloudinaryUrl filename mimeType size uploadedAt createdAt"
    );

    if (!file) return res.status(404).json({ message: "Invalid share link" });

    const link = (file.shareLinks || []).find((l) => l.token === token);
    if (!link) return res.status(404).json({ message: "Invalid share link" });

    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: "Share link expired" });
    }

    return res.json({
      message: "Share link access granted",
      file: {
        id: file._id,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.uploadedAt,
        createdAt: file.createdAt,
      },
      downloadUrl: `/api/share/${token}/download`,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to access link", error: err.message });
  }
};

exports.downloadViaShareLink = async (req, res) => {
  try {
    const { token } = req.params;

    const file = await File.findOne({ "shareLinks.token": token }).select(
      "shareLinks cloudinaryUrl"
    );

    if (!file) return res.status(404).json({ message: "Invalid share link" });

    const link = (file.shareLinks || []).find((l) => l.token === token);
    if (!link) return res.status(404).json({ message: "Invalid share link" });

    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: "Share link expired" });
    }

    return res.redirect(file.cloudinaryUrl);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Download failed", error: err.message });
  }
};

exports.createDownloadTicket = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId).select(
      "owner sharedWith cloudinaryUrl"
    );
    if (!file) return res.status(404).json({ message: "File not found" });

    // reuse your existing access check
    const uid = req.user._id.toString();
    const allowed =
      file.owner.toString() === uid ||
      (file.sharedWith || []).some((id) => id.toString() === uid);

    if (!allowed) return res.status(403).json({ message: "Access denied" });

    const token = nanoid(40);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await DownloadTicket.create({
      token,
      file: file._id,
      user: req.user._id,
      expiresAt,
    });

    res.json({
      ticket: token,
      url: `/api/files/download/${token}`,
      expiresAt,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create ticket", error: err.message });
  }
};

exports.downloadWithTicket = async (req, res) => {
  try {
    const { ticket } = req.params;

    const t = await DownloadTicket.findOne({ token: ticket }).populate("file");
    if (!t) return res.status(404).send("Invalid ticket");

    if (t.expiresAt.getTime() < Date.now()) {
      await DownloadTicket.deleteOne({ _id: t._id });
      return res.status(410).send("Ticket expired");
    }

    await DownloadTicket.deleteOne({ _id: t._id });

    const file = t.file;

    const response = await axios.get(file.cloudinaryUrl, {
      responseType: "stream",
    });

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(file.filename)}"`
    );

    response.data.pipe(res);
  } catch (err) {
    return res.status(500).send("Download failed");
  }
};

exports.accessViaShareLinkPublic = async (req, res) => {
  try {
    const { token } = req.params;

    const file = await File.findOne({ "shareLinks.token": token }).select(
      "shareLinks filename mimeType size uploadedAt createdAt"
    );

    if (!file) return res.status(404).json({ message: "Invalid share link" });

    const link = (file.shareLinks || []).find((l) => l.token === token);
    if (!link) return res.status(404).json({ message: "Invalid share link" });

    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: "Share link expired" });
    }

    return res.json({
      message: "Public share link access granted",
      file: {
        id: file._id,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.uploadedAt,
        createdAt: file.createdAt,
      },
      downloadUrl: `/api/share/${token}/download`,
      expiresAt: link.expiresAt || null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to access link" });
  }
};

exports.downloadViaShareLinkPublic = async (req, res) => {
  try {
    const { token } = req.params;

    const file = await File.findOne({ "shareLinks.token": token }).select(
      "shareLinks cloudinaryUrl filename mimeType"
    );

    if (!file) return res.status(404).json({ message: "Invalid share link" });

    const link = (file.shareLinks || []).find((l) => l.token === token);
    if (!link) return res.status(404).json({ message: "Invalid share link" });

    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: "Share link expired" });
    }

    const response = await axios.get(file.cloudinaryUrl, {
      responseType: "stream",
    });

    const safeName = (file.filename || "download").replace(
      /[/\\?%*:|"<>]/g,
      "-"
    );

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);

    response.data.pipe(res);
  } catch (err) {
    return res.status(500).json({ message: "Download failed" });
  }
};
