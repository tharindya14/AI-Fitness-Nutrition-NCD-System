const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Adaptive Habit Evolution Service is running" });
});

app.listen(5005, () => {
  console.log("Adaptive Habit Evolution Service running on port 5005");
});