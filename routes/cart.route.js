const express = require("express");

const {
  addToCart,
  getCart,
  deleteProductFromCart,
} = require("../controller/cart.controller.js");
const alloewdTo = require("../middlewares/alloewdTo");
const roles = require("../utils/roles");
const verifyToken = require("../middlewares/verifyToken");

const Router = express.Router();

Router.route("/addToCart").post(verifyToken, alloewdTo(roles.USER), addToCart);
Router.route("/")
  .get(verifyToken, alloewdTo(roles.USER), getCart)
  // .put(editCart)
  .delete(verifyToken, alloewdTo(roles.USER), deleteProductFromCart);

module.exports = Router;
