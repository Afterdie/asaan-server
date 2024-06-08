const express = require("express");
const http = require("http");
const https = require("https")
const { Server } = require("socket.io");
const cors = require("cors");

require("dotenv").config();

//created to prevent server spindwon on render
let selfPingTimeout
  const selfPing = () => {
    https.get("https://asaan-server.onrender.com", (res)=> {
      console.log("Pinged self")
    } )

    selfPingTimeout = setTimeout(selfPing, process.env.PINGINTERVAL)
  }


const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

console.log("server is up on ", process.env.PORT);
console.log("pinging every ",process.env.PINGINTERVAL," seconds")
console.log(process.env.SLEEP, typeof(Number(process.env.SLEEP)))
//array of completed orders

let completedOrders = []
//persisting queue of orders
let orders = [];
let orderCnt = 0;

app.use(cors())
app.use(express.json())

//first time join for cook orders are sent
app.get("/api/ongoingorders", (req,res)=> {
  console.log("fetched latest orders")
  res.json({orders})
})

app.get("/api/completedorders", (req,res)=> {
  console.log("fetched completed orders")
  completedOrders = completedOrders.sort((a,b)=> Number(b.uniqueId.split('#')[1]) -
  Number(a.uniqueId.split('#')[1]))
  res.json({completedOrders})
})

//when first connection is made
io.on("connection", (socket) => {

  //role based join room
  socket.on("joinRoom", ({ roomname, role }, callback) => {
    
    //the moment user joins the room timeout begins and is refreshed when order is placed
    if(!Number(process.env.SLEEP) && selfPingTimeout) clearTimeout(selfPingTimeout)
    selfPingTimeout = setTimeout(selfPing, process.env.PINGINTERVAL)

    //assigns the roles and rooomnames to the user
    socket.role = role;
    socket.roomname = roomname;
    socket.join(roomname);
    console.log(`${role} from ${roomname} has joined`);
    io.to(roomname).emit("message", `${role} has joined in`);

    callback({ status: "success" });
  });


  //emitted from the waiter when the order is placed
  socket.on("confirmedOrder", (orderDetails, callback) => {
    orderCnt++;
    orderDetails={...orderDetails, uniqueId:orderDetails.uniqueId+"#"+orderCnt.toString()}
    console.log(orderDetails)
    orders.push(orderDetails);

    //sent to the cook to signal a new order
    io.to(socket.roomname).emit("newOrder", {
      uniqueId: orderDetails.uniqueId,
      order: orderDetails.order,
    });
    callback({ status: "received" });

    //if a timeout had been set already it is cleared
    if(!Number(process.env.SLEEP) && selfPingTimeout) clearTimeout(selfPingTimeout)
      selfPingTimeout = setTimeout(selfPing, process.env.PINGINTERVAL)
  });

  //order id sent from cook and removed from orderlist and added to completed list
  socket.on("completedOrder", ({uniqueId}, callback)=> {
    completedOrders.push(orders.find(item => item.uniqueId == uniqueId))
    orders = orders.filter((item)=> item.uniqueId!==uniqueId)

    io.to(socket.roomname).emit('notifyOrderComplete', `${uniqueId}'s order is ready`)
    callback({status:"completed"})
  })

  socket.on("disconnect", () => {
    console.log("left");
  });
});

httpServer.listen(process.env.PORT);
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
