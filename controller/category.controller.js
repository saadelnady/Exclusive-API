const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Category = require("../models/category.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const getAllCategories = asyncWrapper(async (req, res, next) => {
  const { limit, page } = req.query;
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

  const { title } = req.body;

  const categoryExist = await Category.findOne({
    title: title,
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
  newCategory.image = req.file?.filename;

  await newCategory.save();

  return res
    .status(201)

    .json({
      status: httpStatusText.SUCCESS,
      data: { category: newCategory },
      message: "category added Successfully",
    });
});

const getCategory = asyncWrapper(async (req, res, next) => {
  const { categoryId } = req.params;
  const targetCategory = await Category.findById(categoryId);
  if (!targetCategory) {
    const error = appError.create(
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

const editCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { categoryId } = req.params;

  const targetCategory = await Category.findById(categoryId);
  if (!targetCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const options = {
    new: true,
  };

  const { title } = req.body;
  const categoryExist = await Category.findOne({
    title: title,
  });

  if (categoryExist) {
    const error = appError.create(
      "category is already exist",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    {
      $set: { ...req.body },
    },
    options
  );
  console.log(req.file);
  updatedCategory.image = req.file?.filename;

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { category: updatedCategory },
    message: "category updated Successfully",
  });
});

const deleteCategory = asyncWrapper(async (req, res, next) => {
  const { categoryId } = req.params;
  const targetCategory = await Category.findById(categoryId);
  if (!targetCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const deletedCategory = await Category.deleteOne({ _id: categoryId });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "category deleted Successfully",
    data: { category: deletedCategory },
  });
});

module.exports = {
  getAllCategories,
  addCategory,
  getCategory,
  editCategory,
  deleteCategory,
};
