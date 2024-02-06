require("dotenv").config();
const cors = require("cors");
const path = require("path");

// Routers
const userRouter = require("./routes/user.route");
const productRouter = require("./routes/product.route");
const sellerRouter = require("./routes/seller.route");
const categoryRouter = require("./routes/category.route");
const subCategoriesRouter = require("./routes/subCategory.route");
const uploadRouter = require("./routes/upload");
const express = require("express");
const app = express();

const dbConnection = require("./db/dataBase");
const errorHandler = require("./middlewares/errorHandler");

app.use(cors());
app.use(express.json());
// to preview image
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/api/upload", uploadRouter);

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/sellers", sellerRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subCategories", subCategoriesRouter);

// wild card
app.all("*", (req, res, next) => {
  res.status(400).json({ message: "not found your request" });
});
// handle errors
app.use(errorHandler);
// server running
app.listen(process.env.PORT, () => {
  console.log("server is listening on port ", process.env.PORT);
});
dbConnection();
