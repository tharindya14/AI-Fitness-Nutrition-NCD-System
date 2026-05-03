const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");
////// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "FITSHIELD API Gateway is running",
  });
});

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/auth${path}`,
  })
);

app.use(
  "/api/diet",
  createProxyMiddleware({
    target: process.env.DIET_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/diet${path}`,
  })
);

app.use(
  "/api/exercise",
  createProxyMiddleware({
    target: process.env.EXERCISE_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use(
  "/api/supplement",
  createProxyMiddleware({
    target: process.env.SUPPLEMENT_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use(
  "/api/habit",
  createProxyMiddleware({
    target: process.env.HABIT_SERVICE_URL,
    changeOrigin: true,
  })
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on http://0.0.0.0:${PORT}`);
});