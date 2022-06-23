const express = require("express");
const dayjs = require("dayjs");
const path = require("path");
const NodeJsonDB = require("node-json-db");
const JsonDBConfig = require("node-json-db/dist/lib/JsonDBConfig");

const app = express();
const port = 3000;

const db = new NodeJsonDB.JsonDB(
  new JsonDBConfig.Config("unitDB", true, false, "/")
);

db.push("/franchisees/", [
  ...require("./data/franchisees.json").map((d) => ({
    id: d._id,
    firstName: d.first_name,
    lastName: d.last_name,
    locationIds: d.location_ids,
  })),
]);

db.push("/locations/", [
  ...require("./data/locations.json").map((d) => ({
    id: d._id,
    address: d.address,
  })),
]);

db.push("/sales/", [
  ...require("./data/sales.json").map((d) => ({
    id: d._id,
    franchiseeId: d.franchisee_id,
    locationId: d.location_id,
    date: d.date,
    subtotal: d.subtotal,
    tax: d.tax,
    total: d.total,
  })),
]);

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/franchisees", (_, res) => {
  res.send(db.getData("/franchisees"));
});

app.get("/locations", (_, res) => {
  res.send(db.getData("/locations"));
});

app.get("/sales", (req, res) => {
  const { franchisee, location, date } = req.query;

  let data = db.getData("/sales");

  if (franchisee) {
    data = data.filter((i) => i.franchiseeId === franchisee);
  }

  if (location) {
    data = data.filter((i) => i.locationId === location);
  }

  if (date) {
    data = data.filter((i) => dayjs(i.date).format("YYYY-MM-DD") === date);
  }

  res.send(data);
});

app.listen(port, () => {
  console.log(`Unit 203: Port ${port}`);
});
