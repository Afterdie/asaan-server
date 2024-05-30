const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

require("dotenv").config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

console.log("server is up");

//array of completed orders

//persisting queue of orders
let orders = [];

//when first connection is made
io.on("connection", (socket) => {
  console.log(socket.id);

  //role based join room
  socket.on("joinRoom", ({ roomname, role }, callback) => {
    socket.role = role;
    socket.roomname = roomname;
    socket.join(roomname);
    console.log(`${role} from ${roomname} has joined`);
    io.to(roomname).emit("message", `${role} has joined in`);

    callback({ status: "success" });
  });

  socket.on("confirmedOrder", ({ waiterOrder, timeStamp }, callback) => {
    console.log(waiterOrder, timeStamp);
    orders.push(waiterOrder);
    io.to(socket.roomname).emit("newOrder", { waiterOrder, timeStamp });
    callback({ status: "received" });
  });

  socket.on("getOrders", () => {
    console.log(orders);
  });

  socket.on("disconnect", () => {
    console.log("left");
  });
});

httpServer.listen(3000);
// const pool = require("./database");
// app.use(express.json());
// app.use(cors());

// app.get("/", (req, res) => {
//   // Send a simple text response
//   res.send("Hello, world!");
// });
// app.post("/addproduct", (req, res) => {
//   console.log(req.body);
//   const UPC = req.body["upc"];
//   const NAME = req.body["name"];
//   const COST = req.body["cost"];
//   const insertQuery = `INSERT INTO product_upc (upc, name, cost) VALUES ( ${UPC}, '${NAME}', ${COST});`;
//   pool
//     .query(insertQuery)
//     .then((response) => {
//       console.log("data saved");
//       console.log(response);
//     })
//     .catch((err) => console.log(err));

//   res.send("Entry was added");
// });

// app.post("/validateupc", async (req, res) => {
//   console.log("validation request");
//   const selectQuery = `SELECT * FROM product_upc WHERE upc=${req.body["upc"]}`;
//   try {
//     const result = await pool.query(selectQuery);
//     if (result.rows.length > 0) res.json({ found: true, item: result.rows[0] });
//     else res.send({ found: false });
//     console.log("product validated: ");
//   } catch (error) {
//     console.error("Error executing the query", error);
//   }
// });
// app.listen(process.env.PORT, () =>
//   console.log("server listening on localHost:", process.env.PORT)
// );
