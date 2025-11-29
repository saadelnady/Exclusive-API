const express = require("express");

const {
  addToCart,
  getCart,
  deleteProductFromCart,
  editCart,
} = require("../controller/cart.controller.js");
const alloewdTo = require("../middlewares/alloewdTo");
const { roles } = require("../utils/constants");
const verifyToken = require("../middlewares/verifyToken");

const Router = express.Router();

Router.route("/").post(verifyToken, alloewdTo(roles.USER), addToCart);
Router.route("/").get(verifyToken, alloewdTo(roles.USER), getCart);

Router.route("/:cartId").put(editCart);
Router.route("/:cartId").delete(
  verifyToken,
  alloewdTo(roles.USER),
  deleteProductFromCart
);

module.exports = Router;
