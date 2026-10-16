const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();

app.use(cors());

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