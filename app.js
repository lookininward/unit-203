const express = require("express");
const app = express();
const port = 3000;

const path = require("path");

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.listen(port, () => {
  console.log(`Unit 203: Port ${port}`);
});
