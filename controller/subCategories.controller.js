const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const subCategory = require("../models/subCategory.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const Subcategory = require("../models/subCategory.model");
const Category = require("../models/category.model");

const getAllSubCategories = asyncWrapper(async (req, res, next) => {
  const { limit, page } = req.query;
  const skip = (page - 1) * limit;
  const subCategouries = await subCategory
    .find({}, { __v: false })
    .populate("category")
    .limit(limit)
    .skip(skip);

  if (!subCategouries) {
    const error = appError.create(
      "No subcategories to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { subCategouries } });
});

const addSubCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }
  const categoryId = req.body.category;
  const subCategoryTitle = req.body.title;
  const targetCategory = await Category.findOne({ _id: categoryId });
  console.log("targetCategory =====>", targetCategory);
  if (!targetCategory) {
    return res.json({
      status: httpStatusText.FAIL,
      errors: "Category not found",
    });
  }

  // Check if a subcategory with the same title already exists in the category

  const subCategoryExist = await Subcategory.findOne({
    _id: { $in: targetCategory.subCategories },
    title: subCategoryTitle,
  });
  console.log("existingSubcategory", subCategoryExist);
  if (subCategoryExist) {
    const error = appError.create(
      "Subcategory with the same title already exists in the category",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  } else {
    const newSubCategory = new Subcategory({
      title: subCategoryTitle,
      image: req.file?.filename,
      category: categoryId,
    });

    // save new subCategory in database
    await newSubCategory.save();
    // Update the category's subCategories array with the new subcategory's ObjectId
    await Category.findByIdAndUpdate(categoryId, {
      $push: { subCategories: newSubCategory._id },
    });
    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      data: { subCategory: newSubCategory },
      messege: "subcategory added successfully",
    });
  }
});

const getSubCategory = asyncWrapper(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const targetSubCategory = await Subcategory.findById(subCategoryId).populate(
    "category"
  );
  if (!targetSubCategory) {
    const error = appError.create(
      "Subcategory not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!subCategoryId) {
    const error = appError.create(
      "subCategoryId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: targetSubCategory });
});

const editSubCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { subCategoryId } = req.params;
  console.log(subCategoryId);
  const targetSubCategory = await Subcategory.findById(subCategoryId);
  if (!targetSubCategory) {
    const error = appError.create(
      "targetSubCategory not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const options = {
    new: true,
  };

  const { title } = req.body;
  const subCategoryExist = await Subcategory.findOne({
    title: title,
  });

  if (subCategoryExist) {
    const error = appError.create(
      "subCategory is already exist",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const updatedSubCategory = await Subcategory.findByIdAndUpdate(
    subCategoryId,
    {
      $set: { ...req.body },
    },
    options
  ).populate("category");

  updatedSubCategory.image = req.file?.filename;

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { category: updatedSubCategory },
    message: "SubCategory updated Successfully",
  });
});

const deleteSubCategory = asyncWrapper(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const targetSubCategory = await Subcategory.findById(subCategoryId);
  if (!targetSubCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const deletedSubCategory = await Subcategory.deleteOne({
    _id: subCategoryId,
  });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Subcategory deleted Successfully",
    data: { SubCategory: deletedSubCategory },
  });
});
module.exports = {
  getAllSubCategories,
  addSubCategory,
  getSubCategory,
  editSubCategory,
  deleteSubCategory,
};
