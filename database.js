const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASS,
  host: "localhost",
  port: 5432,
  database: "testing",
});

module.exports = pool;
