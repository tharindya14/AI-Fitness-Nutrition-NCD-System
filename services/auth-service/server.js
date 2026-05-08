const express = require("express");
const cors = require("cors");
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

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Auth Service is running" });
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