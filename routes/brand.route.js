const express = require("express");

const { brandValidation } = require("../middlewares/brandValidation.js");

const {
  getAllBrands,
  addBrand,
  getBrand,
  editBrand,
  deleteBrand,
} = require("../controller/brand.controller.js");

const Router = express.Router();

Router.route("/").get(getAllBrands).post(brandValidation(), addBrand);
Router.route("/:brandId")
  .get(getBrand)
  .put(brandValidation(), editBrand)
  .delete(deleteBrand);

module.exports = Router;
