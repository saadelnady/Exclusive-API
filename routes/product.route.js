const express = require("express");

const {
  getAllProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
  getSellerProducts,
  getProductsAddRequests,
  // acceptProductRequest,
  // blockProductRequest,
} = require("../controller/product.controller");

const allowedTo = require("../middlewares/alloewdTo");
const { productValidation } = require("../middlewares/productValidation");
const { storage, fileFilter } = require("../utils/multer");

const multer = require("multer");
const userRoles = require("../utils/user.roles");

const upload = multer({ storage: storage, fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAllProducts)
  .post(upload.array("images", 10), productValidation(), addProduct);

Router.route("/productsAddRequests").get(
  // allowedTo(userRoles.ADMIN),
  getProductsAddRequests
);
Router.route("/sellerProducts").get(getSellerProducts);

Router.route("/:productId")
  .get(getProduct)
  .put(upload.array("images", 10), productValidation(), editProduct)
  .delete(deleteProduct);

// Router.route("/acceptProduct/:productId").put(
//   allowedTo(userRoles.ADMIN),
//   acceptProductRequest
// );
// Router.route("/blockProduct/:productId").put(
//   allowedTo(userRoles.ADMIN),
//   blockProductRequest
// );
module.exports = Router;
