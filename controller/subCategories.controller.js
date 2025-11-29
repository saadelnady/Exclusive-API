const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const subCategory = require("../models/subCategory.model.js");
const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const Category = require("../models/category.model");
const Product = require("../models/product.model");

const mongoose = require("mongoose");
const { escapeRegex } = require("../utils/utils.js");

const getAllSubCategories = asyncWrapper(async (req, res, next) => {
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

  const [subCategories, totalSubCategoriesCount] = await Promise.all([
    subCategory
      .find(searchQuery, { __v: 0 })
      .populate("category")
      .limit(limit)
      .skip(skip),
    subCategory.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      subCategories,
      total: totalSubCategoriesCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalSubCategoriesCount / limit),
    },
  });
});

const addSubCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { categoryId, title, image } = req.body;

  const targetCategory = await Category.findOne({ _id: categoryId });

  if (!targetCategory) {
    return res.json({
      status: httpStatusText.FAIL,
      errors: {
        ar: "القسم غير موجود",
        en: "Category not found",
      },
    });
  }

  const subCategoryExist = await subCategory.findOne({
    category: categoryId,
    $or: [{ "title.ar": title.ar }, { "title.en": title.en }],
  });

  if (subCategoryExist) {
    const error = appError.create(
      {
        ar: "القسم الفرعي موجود بالفعل",
        en: "Subcategory already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newSubCategory = new subCategory({
    title,
    category: categoryId,
    image,
  });

  await newSubCategory.save();

  await Category.findByIdAndUpdate(categoryId, {
    $push: { subCategories: newSubCategory._id },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { subCategory: newSubCategory },
    message: {
      ar: "تم إضافة القسم الفرعي بنجاح",
      en: "Subcategory added successfully",
    },
  });
});

const getSubCategory = asyncWrapper(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const targetSubCategory = await subCategory
    .findById(subCategoryId)
    .populate("category");
  if (!targetSubCategory) {
    const error = appError.create(
      {
        ar: "القسم الفرعي غير موجود",
        en: "Subcategory not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!subCategoryId) {
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
    data: { subCategory: targetSubCategory },
  });
});

const editSubCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { subCategoryId } = req.params;
  const { categoryId, title, image } = req.body; // title = { ar, en }

  const targetSubCategory = await subCategory.findById(subCategoryId);
  if (!targetSubCategory) {
    const error = appError.create(
      {
        ar: "القسم الفرعي غير موجود",
        en: "Subcategory not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

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

  const subCategoryExist = await subCategory.findOne({
    _id: { $ne: subCategoryId },
    category: categoryId,
    $or: [{ "title.ar": title.ar }, { "title.en": title.en }],
  });

  if (subCategoryExist) {
    const error = appError.create(
      {
        ar: "قسم فرعي بنفس الاسم موجود بالفعل في هذا القسم",
        en: "Subcategory with the same title already exists in the category",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const updatedSubCategoryData = {
    image,
    title,
    category: categoryId,
  };

  if (categoryId !== targetSubCategory.category.toString()) {
    await Category.findByIdAndUpdate(targetSubCategory.category, {
      $pull: { subCategories: subCategoryId },
    });

    await Category.findByIdAndUpdate(categoryId, {
      $push: { subCategories: subCategoryId },
    });
  }

  const updatedSubCategory = await subCategory
    .findByIdAndUpdate(
      subCategoryId,
      { $set: updatedSubCategoryData },
      { new: true }
    )
    .populate("category");

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { subCategory: updatedSubCategory },
    message: {
      ar: "تم تعديل القسم الفرعي بنجاح",
      en: "Subcategory updated successfully",
    },
  });
});

const deleteSubCategory = asyncWrapper(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const targetSubCategory = await subCategory.findById(subCategoryId);
  if (!targetSubCategory) {
    const error = appError.create(
      {
        ar: "القسم الفرعي غير موجود",
        en: "Subcategory not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const hasProducts = await Product.exists({ subCategory: subCategoryId });
  if (hasProducts) {
    return res.status(400).json({
      message: {
        ar: "لا يمكن حذف القسم الفرعى لانه يحتوي على منتجات",
        en: "Cannot delete the subcategory because it has products",
      },
    });
  } else {
    await subCategory.deleteOne({
      _id: subCategoryId,
    });

    await Category.findByIdAndUpdate(
      targetSubCategory.category,
      { $pull: { subCategories: subCategoryId } },
      { new: true }
    );
    res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "تم حذف القسم الفرعي بنجاح",
        en: "Subcategory deleted successfully",
      },
      data: { SubCategory: targetSubCategory },
    });
  }
});

module.exports = {
  getAllSubCategories,
  addSubCategory,
  getSubCategory,
  editSubCategory,
  deleteSubCategory,
};
