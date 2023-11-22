const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./routes/user.route");
const app = express();
const httpStatusText = require("./utils/utils");

app.use(express.json());
app.use(cors());

app.use("/api/users", userRouter);
// wild card
app.all("*", (req, res, next) => {
  res.status(400).json({ message: "not found your request" });
});
// handle errors
app.use((error, req, res, next) => {
  return res.status(error.statusCode || 500).json({
    status: error.statusText,
    message: error.message,
    code: error.statusCode,
  });
});
app.listen(process.env.PORT, () => {
  console.log("server is listening on port ", process.env.PORT);
});
mongoose.connect(process.env.DB_URL).then(() => {
  console.log("connected to mongodb successfully");
});
