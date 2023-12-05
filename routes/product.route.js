const express = require("express");

const {
  getAllProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
} = require("../controller/product.controller");
const productValidation = require("../middlewares/productValidation");
const { configureMulter, fileFilter } = require("../utils/multer");

const multer = require("multer");

const upload = multer({ storage: configureMulter("products"), fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAllProducts)
  .post(upload.single("productImage"), productValidation(), addProduct);

Router.route("/:productId")
  .get(getProduct)
  .put(editProduct)
  .delete(deleteProduct);

module.exports = Router;
