const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const dietRoutes = require("./src/routes/dietRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/diet", dietRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Diet Safety Service is running" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Diet Service MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Diet Service running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));