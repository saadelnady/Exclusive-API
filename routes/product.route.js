const express = require("express");

const {
  getAllProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
} = require("../controller/product.controller");
const productValidation = require("../middlewares/productValidation");
const { storage, fileFilter } = require("../utils/multer");

const multer = require("multer");

const upload = multer({ storage: storage, fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAllProducts)
  .post(upload.array("images", 5), productValidation(), addProduct);

Router.route("/:productId")
  .get(getProduct)
  .put(editProduct)
  .delete(deleteProduct);

module.exports = Router;
