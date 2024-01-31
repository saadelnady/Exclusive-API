const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Category = require("../models/category.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const getAllCategories = asyncWrapper(async (req, res, next) => {
  const query = req.query;

  const limit = query.limit;
  const page = query.page;
  const skip = (page - 1) * limit;
  const categouries = await Category.find({}, { __v: false })
    .limit(limit)
    .skip(skip);
  if (!categouries) {
    const error = appError.create(
      "No categories to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { categouries } });
});

const addCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { categoryTitle } = req.body;

  const categoryExist = await Category.findOne({
    categoryTitle: categoryTitle,
  });
  if (categoryExist) {
    const error = appError.create(
      " category is already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newCategory = new Category({ ...req.body });
  newCategory.categoryImage = req.file.filename;

  await newCategory.save();

  return res
    .status(201)
    .json({ status: httpStatusText.SUCCESS, data: { category: newCategory } });
});

const getCategory = asyncWrapper(async (req, res, next) => {
  const { categoryId } = req.params;
  const targetCategory = await Category.findById(categoryId);
  if (!targetCategory) {
    const error = new appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!categoryId) {
    const error = appError.create(
      "categoryId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: targetCategory });
});

const editCategory = asyncWrapper(async (req, res, next) => {});

module.exports = {
  getAllCategories,
  addCategory,
  getCategory,
  editCategory,
};
