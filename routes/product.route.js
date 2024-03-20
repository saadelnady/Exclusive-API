const express = require("express");

const {
  getAcceptedProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
  getAcceptedSellerProducts,
  getPendingProducts,
  acceptProduct,
  blockProduct,
  unblockProduct,
  getBlockedProducts,
} = require("../controller/product.controller");

const allowedTo = require("../middlewares/alloewdTo");
const { productValidation } = require("../middlewares/productValidation");
const { storage, fileFilter } = require("../utils/multer");

const multer = require("multer");
const userRoles = require("../utils/user.roles");

const upload = multer({ storage: storage, fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAcceptedProducts)
  .post(upload.array("images", 10), productValidation(), addProduct);

Router.route("/pendingProducts").get(
  // allowedTo(userRoles.ADMIN),
  getPendingProducts
);
Router.route("/blockedProducts").get(
  // allowedTo(userRoles.ADMIN),
  getBlockedProducts
);

Router.route("/acceptedSellerProducts").get(getAcceptedSellerProducts);

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
