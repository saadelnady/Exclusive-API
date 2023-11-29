require("dotenv").config();
const cors = require("cors");
const path = require("path");
const httpStatusText = require("./utils/utils");
const userRouter = require("./routes/user.route");
const productRouter = require("./routes/product.route");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dbConnection = require("./db/dataBase");
const errorHHandler = require("./middlewares/errorHHandler");

app.use(express.json());
app.use(cors());
app.use(
  "/uploads/users",
  express.static(path.join(__dirname, "uploads/users"))
);
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "uploads/products"))
);

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
// wild card
app.all("*", (req, res, next) => {
  res.status(400).json({ message: "not found your request" });
});
// handle errors
app.use(errorHHandler);
// server running
app.listen(process.env.PORT, () => {
  console.log("server is listening on port ", process.env.PORT);
});
dbConnection();
