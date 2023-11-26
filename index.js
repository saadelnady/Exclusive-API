require("dotenv").config();
const cors = require("cors");
const path = require("path");
const httpStatusText = require("./utils/utils");
const userRouter = require("./routes/user.route");
const productRouter = require("./routes/product.route");
const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
// wild card
app.all("*", (req, res, next) => {
  res.status(400).json({ message: "not found your request" });
});
// handle errors
app.use((error, req, res, next) => {
  return res.status(error.statusCode).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message,
    code: error.statusCode,
    data: null,
  });
});
// server running
app.listen(process.env.PORT, () => {
  console.log("server is listening on port ", process.env.PORT);
});
// vonnecting with mongodb
mongoose.connect(process.env.DB_URL).then(() => {
  console.log("connected to mongodb successfully");
});
