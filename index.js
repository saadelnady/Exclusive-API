if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config();
}

const cors = require("cors");
const path = require("path");

// Routers
const adminRouter = require("./routes/admin.route.js");
const userRouter = require("./routes/user.route.js");
const productRouter = require("./routes/product.route.js");
const sellerRouter = require("./routes/seller.route.js");
const categoryRouter = require("./routes/category.route");
const subCategoriesRouter = require("./routes/subCategory.route.js");
const brandRouter = require("./routes/brand.route.js");
const couponCodeRouter = require("./routes/couponCode.route");
const cartRouter = require("./routes/cart.route.js");
const settingsRouter = require("./routes/settings.route");
const uploadRouter = require("./routes/upload.route.js");
const wishListRouter = require("./routes/wishList.route.js");
const pagesRouter = require("./routes/pages.route.js");
const ordersRouter = require("./routes/orders.route.js");
const contactUsRouter = require("./routes/contactUs.route.js");
const flashSaleRouter = require("./routes/flashSale.route.js");

// express
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();

// db connection
const dbConnection = require("./db/dataBase");
const errorHandler = require("./middlewares/errorHandler");

// parsing body
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.set("trust proxy", true);

// to preview image
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/upload", uploadRouter);

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/sellers", sellerRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/brands", brandRouter);
app.use("/api/subCategories", subCategoriesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishList", wishListRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/pages", pagesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/contactUs", contactUsRouter);
app.use("/api/flashSale", flashSaleRouter);

app.use("/api/couponCode", couponCodeRouter);

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
