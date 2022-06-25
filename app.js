const express = require("express");
const paginate = require("express-paginate");
const dayjs = require("dayjs");
const path = require("path");
const NodeJsonDB = require("node-json-db");
const JsonDBConfig = require("node-json-db/dist/lib/JsonDBConfig");

const LOCALE = "en-US";
const FEE_PERCENT = 0.1;

const formatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
});

const formatCurrency = (val) => formatter.format(val);
const sumArray = (arr) => arr.reduce((a, b) => a + b, 0);

const app = express();
const port = 3000;

const pageLimit = 500;
app.use(paginate.middleware(pageLimit, pageLimit));

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
  ...require("./data/sales.json").map((d) => {
    const fee = d.subtotal * FEE_PERCENT;
    return {
      id: d._id,
      franchiseeId: d.franchisee_id,
      locationId: d.location_id,
      date: d.date,
      subtotal: {
        raw: d.subtotal,
        currency: formatCurrency(d.subtotal),
      },
      tax: {
        raw: d.tax,
        currency: formatCurrency(d.tax),
      },
      total: {
        raw: d.total,
        currency: formatCurrency(d.total),
      },
      fee: {
        raw: fee,
        currency: formatCurrency(fee),
      },
    };
  }),
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
  const { franchisee, location, date, page } = req.query;

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

  const numResults = data.length;
  const pageCount = Math.ceil(numResults / pageLimit);
  const pages = paginate.getArrayPages(req)(pageCount, pageCount, page);
  const start = page === 1 ? 0 : (page - 1) * pageLimit;
  const end = page === 1 ? pageLimit : page * pageLimit;
  const filteredResults = data.slice(start, end);
  const subTotal = sumArray(data.map((sale) => sale["subtotal"].raw));
  const total = sumArray(data.map((sale) => sale["total"].raw));
  const fees = subTotal * FEE_PERCENT;

  res.send({
    currPage: page,
    records: filteredResults,
    pages,
    nextPage: paginate.href(req)(),
    prevPage: paginate.href(req)(true),
    subtotal: formatCurrency(subTotal),
    total: formatCurrency(total),
    fees: formatCurrency(fees),
    numTotalResults: data.length.toLocaleString(LOCALE),
  });
});

app.listen(port, () => {
  console.log(`Unit 203: Port ${port}`);
});
