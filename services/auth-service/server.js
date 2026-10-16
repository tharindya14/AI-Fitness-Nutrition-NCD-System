const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();
const dns = require("dns");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const authRoutes = require("./src/routes/authRoutes");

const app = express();

app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Auth Service → port 5001
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://localhost:5001",
    changeOrigin: true,
    logLevel: "debug",
  })
);

// Diet Service → port 5002
app.use(
  "/api/diet",
  createProxyMiddleware({
    target: "http://localhost:5002",
    changeOrigin: true,
    logLevel: "debug",
  })
);

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FITSHIELD API Gateway is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on http://0.0.0.0:${PORT}`);
});
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Auth Service MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Auth Service running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
