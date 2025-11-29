const express = require("express");
const {
  getAllFlashSales,
  getActiveFlashSale,
  getFlashSale,
  addFlashSale,
  editFlashSale,
  deleteFlashSale,
  addProductToFlashSale,
} = require("../controller/flashSale.controller.js");

const {
  flashSaleValidation,
} = require("../middlewares/flashSaleValidation.js");

const Router = express.Router();

Router.route("/")
  .get(getAllFlashSales)
  .post(flashSaleValidation(), addFlashSale);

Router.post("/flash-sale/:flashSaleId/add-product", addProductToFlashSale);

Router.route("/active").get(getActiveFlashSale);

Router.route("/:flashSaleId")
  .get(getFlashSale)
  .put(flashSaleValidation(), editFlashSale)
  .delete(deleteFlashSale);

module.exports = Router;
