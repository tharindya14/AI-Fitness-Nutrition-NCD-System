const express = require("express");
const cors = require("cors");
const dns = require("dns");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const supplementRoutes = require("./src/routes/supplementRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/supplements", supplementRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Supplement Service is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "supplement-service",
    status: "healthy",
  });
});

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Supplement Service MongoDB connected");

    app.listen(process.env.PORT || 5004, () => {
      console.log(`Supplement Service running on port ${process.env.PORT || 5004}`);
    });
  })
  .catch((err) => {
    console.error("Supplement Service MongoDB connection error:", err);
  });