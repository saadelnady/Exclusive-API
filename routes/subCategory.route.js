const express = require("express");
const Router = express.Router();
const {
  addCategoryValidation,
  editCategoryValidation,
} = require("../middlewares/categoryValidation");

const multer = require("multer");
const { configureMulter, fileFilter } = require("../utils/multer");

const upload = multer({
  storage: configureMulter("subCategories"),
  fileFilter,
});
const {
  getAllSubCategories,
  addSubCategory,
  getSubCategory,
  editSubCategory,
  deleteSubCategory,
} = require("../controller/subCategories.controller");

Router.route("/")
  .get(getAllSubCategories)
  .post(upload.single("image"), addCategoryValidation(), addSubCategory);

Router.route("/:subCategoryId")
  .get(getSubCategory)
  .put(upload.single("image"), editCategoryValidation(), editSubCategory)
  .delete(deleteSubCategory);

module.exports = Router;
