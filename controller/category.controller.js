const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Category = require("../models/category.model");
const Product = require("../models/product.model");

const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const mongoose = require("mongoose");
const { escapeRegex } = require("../utils/utils");

const getAllCategories = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  const searchQuery = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery.$or = [
      { "title.ar": regex },
      { "title.en": regex },
      {
        _id: mongoose.Types.ObjectId.isValid(text)
          ? new mongoose.Types.ObjectId(text)
          : undefined,
      },
    ].filter(Boolean);
  }

  const [categories, totalCategoriesCount] = await Promise.all([
    Category.find(searchQuery, { __v: 0 })
      .populate("subCategories")
      .limit(limit)
      .skip(skip),
    Category.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      categories,
      total: totalCategoriesCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalCategoriesCount / limit),
    },
  });
});

const addCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const {
    title: { ar, en },
  } = req.body;

  const categoryExist = await Category.findOne({
    $or: [{ "title.ar": ar }, { "title.en": en }],
  });
  if (categoryExist) {
    const error = appError.create(
      {
        ar: "القسم موجود بالفعل",
        en: "Category already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newCategory = new Category({ ...req.body });

  await newCategory.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { category: newCategory },
    message: {
      ar: "تم اضافة القسم بنجاح",
      en: "Category added successfully",
    },
  });
});

const getCategory = asyncWrapper(async (req, res, next) => {
  const { categoryId } = req.params;
  const targetCategory = await Category.findById(categoryId).populate(
    "subCategories"
  );
  if (!targetCategory) {
    const error = appError.create(
      {
        ar: "القسم غير موجود",
        en: "Category not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!categoryId) {
    const error = appError.create(
      {
        ar: "المعرف غير صحيح",
        en: "Invalid id",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { category: targetCategory },
  });
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
      {
        ar: "القسم غير موجود",
        en: "Category not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const {
    title: { ar, en },
  } = req.body;

  const categoryExist = await Category.findOne({
    _id: { $ne: categoryId },
    $or: [{ "title.ar": ar }, { "title.en": en }],
  });

  if (categoryExist) {
    const error = appError.create(
      {
        ar: "القسم موجود بالفعل",
        en: "Category already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const updateFields = { ...req.body };

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { $set: updateFields },
    { new: true }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { category: updatedCategory },
    message: {
      ar: "تم تعديل القسم بنجاح",
      en: "Category updated successfully",
    },
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

  const hasProducts = await Product.exists({ category: categoryId });
  if (hasProducts) {
    return res.status(400).json({
      message: {
        ar: "لا يمكن حذف القسم لانه يحتوي على منتجات",
        en: "Cannot delete the category because it has products",
      },
    });
  } else {
    await Category.deleteOne({ _id: categoryId });
    res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "تم حذف القسم بنجاح",
        en: "Category deleted successfully",
      },
      data: { category: targetCategory },
    });
  }
});

module.exports = {
  getAllCategories,
  addCategory,
  getCategory,
  editCategory,
  deleteCategory,
};
