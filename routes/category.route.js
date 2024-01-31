const express = require("express");

const categoryValidation = require("../middlewares/categoryValidation");

const {
  getAllCategories,
  addCategory,
  getCategory,
  editCategory,
} = require("../controller/category.controller");

const multer = require("multer");
const { configureMulter, fileFilter } = require("../utils/multer");

const upload = multer({ storage: configureMulter("categories"), fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAllCategories)
  .post(upload.single("categoryImage"), categoryValidation(), addCategory);

Router.route("/:categoryId").get(getCategory).put(editCategory);
//   .delete(deleteCategory);

module.exports = Router;
