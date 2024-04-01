const express = require("express");
const Router = express.Router();
const multer = require("multer");

const { storage, fileFilter } = require("../utils/multer");
const upload = multer({ storage: storage, fileFilter });

const {
  getProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
  getAcceptedSellerProducts,
  acceptProduct,
  blockProduct,
  unblockProduct,
  getFlashSalesProducts,
} = require("../controller/product.controller");

const allowedTo = require("../middlewares/alloewdTo");
const userRoles = require("../utils/user.roles");
const { productValidation } = require("../middlewares/productValidation");

Router.route("/")
  .get(getProducts)
  .post(upload.array("images", 10), productValidation(), addProduct);

Router.route("/acceptedSellerProducts").get(getAcceptedSellerProducts);
Router.route("/flashSales").get(getFlashSalesProducts);

Router.route("/:productId")
  .get(getProduct)
  .put(upload.array("images", 10), productValidation(), editProduct)
  .delete(deleteProduct);

Router.route("/acceptProduct/:productId").put(
  // allowedTo(userRoles.ADMIN),
  acceptProduct
);
Router.route("/blockProduct/:productId").put(
  // allowedTo(userRoles.ADMIN),
  blockProduct
);
Router.route("/unblockProduct/:productId").put(
  // allowedTo(userRoles.ADMIN),
  unblockProduct
);
module.exports = Router;
