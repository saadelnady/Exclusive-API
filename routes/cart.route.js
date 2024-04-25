const express = require("express");

const { addToCart, getCart } = require("../controller/cart.controller.js");
const alloewdTo = require("../middlewares/alloewdTo");
const roles = require("../utils/roles");
const verifyToken = require("../middlewares/verifyToken");

const Router = express.Router();

Router.route("/add-to-cart").post(
  verifyToken,
  alloewdTo(roles.USER),
  addToCart
);
Router.route("/").get(verifyToken, alloewdTo(roles.USER), getCart);

module.exports = Router;
