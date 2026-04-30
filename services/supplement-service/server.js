const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Supplement Advisory Service is running" });
});

app.listen(5004, () => {
  console.log("Supplement Advisory Service running on port 5004");
});