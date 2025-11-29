const express = require("express");
const Router = express.Router();

const {
  getProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
} = require("../controller/product.controller.js");

const allowedTo = require("../middlewares/alloewdTo");
const { roles } = require("../utils/constants");
const { productValidation } = require("../middlewares/productValidation");
const verifyToken = require("../middlewares/verifyToken");

Router.route("/")
  .get(getProducts)
  .post(verifyToken, allowedTo(roles.SELLER), productValidation(), addProduct);

Router.route("/:productId").get(getProduct);

Router.route("/:productId").put(
  verifyToken,
  allowedTo(roles.SELLER, roles.ADMIN, roles.SUPER_ADMIN),
  productValidation(),
  editProduct
);

Router.route("/:productId").delete(
  verifyToken,
  allowedTo(roles.SELLER, roles.ADMIN, roles.SUPER_ADMIN),
  deleteProduct
);

module.exports = Router;
