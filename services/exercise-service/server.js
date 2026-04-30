const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Exercise Posture Service is running" });
});

app.listen(5003, () => {
  console.log("Exercise Posture Service running on port 5003");
});