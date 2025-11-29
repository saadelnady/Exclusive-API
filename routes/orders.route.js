const express = require("express");
const {
  createOrder,
  getAllOrders,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
} = require("../controller/order.controller.js");

const verifyToken = require("../middlewares/verifyToken.js");
const { roles } = require("../utils/constants.js");
const alloewdTo = require("../middlewares/alloewdTo.js");

const router = express.Router();

router
  .route("/")
  .post(verifyToken, alloewdTo(roles.USER), createOrder)
  .get(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), getAllOrders);

router
  .route("/user/:userId")
  .get(verifyToken, alloewdTo(roles.USER), getUserOrders);

router
  .route("/seller/:sellerId")
  .get(verifyToken, alloewdTo(roles.SELLER), getSellerOrders);

router
  .route("/:orderId")
  .put(verifyToken, alloewdTo(roles.ADMIN, roles.SELLER), updateOrderStatus);

module.exports = router;
