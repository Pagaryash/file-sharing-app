const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
const shareRoutes = require("./routes/shareRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is working" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

app.use("/api/share", shareRoutes);

// Global error handler (must be last)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      message: err.message || "Request error",
      name: err.name,
    });
  }
  next();
});
module.exports = app;
