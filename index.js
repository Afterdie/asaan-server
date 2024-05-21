const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

const pool = require("./database");
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  // Send a simple text response
  res.send("Hello, world!");
});
app.post("/addproduct", (req, res) => {
  console.log(req.body);
  const UPC = req.body["upc"];
  const NAME = req.body["name"];
  const COST = req.body["cost"];
  const insertQuery = `INSERT INTO product_upc (upc, name, cost) VALUES ( ${UPC}, '${NAME}', ${COST});`;
  pool
    .query(insertQuery)
    .then((response) => {
      console.log("data saved");
      console.log(response);
    })
    .catch((err) => console.log(err));

  res.send("Entry was added");
});

app.post("/validateupc", async (req, res) => {
  console.log("validation request");
  const selectQuery = `SELECT * FROM product_upc WHERE upc=${req.body["upc"]}`;
  try {
    const result = await pool.query(selectQuery);
    if (result.rows.length > 0) res.json({ found: true, item: result.rows[0] });
    else res.send({ found: false });
    console.log("product validated: ");
  } catch (error) {
    console.error("Error executing the query", error);
  }
});
app.listen(process.env.PORT, () =>
  console.log("server listening on localHost:4000")
);
