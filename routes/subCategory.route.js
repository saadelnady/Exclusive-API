const express = require("express");
const Router = express.Router();
const {
  addSubCategoryValidation,
  editSubCategoryValidation,
} = require("../middlewares/subCategoryValidation");

const {
  getAllSubCategories,
  addSubCategory,
  getSubCategory,
  editSubCategory,
  deleteSubCategory,
} = require("../controller/subCategories.controller");

Router.route("/")
  .get(getAllSubCategories)
  .post(addSubCategoryValidation(), addSubCategory);

Router.route("/:subCategoryId")
  .get(getSubCategory)
  .put(editSubCategoryValidation(), editSubCategory)
  .delete(deleteSubCategory);

module.exports = Router;
