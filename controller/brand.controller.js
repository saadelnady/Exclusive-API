const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Brand = require("../models/brand.model");
const Product = require("../models/product.model");

const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const mongoose = require("mongoose");
const { escapeRegex } = require("../utils/utils");

const getAllBrands = asyncWrapper(async (req, res, next) => {
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

  const [brands, totalBrandsCount] = await Promise.all([
    Brand.find(searchQuery, { __v: 0 }).limit(limit).skip(skip),
    Brand.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      brands,
      total: totalBrandsCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalBrandsCount / limit),
    },
  });
});

const addBrand = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const {
    title: { ar, en },
  } = req.body;

  const brandExist = await Brand.findOne({
    $or: [{ "title.ar": ar }, { "title.en": en }],
  });
  if (brandExist) {
    const error = appError.create(
      {
        ar: "الماركة موجودة بالفعل",
        en: "Brand already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newBrand = new Brand({ ...req.body });

  await newBrand.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { brand: newBrand },
    message: {
      ar: "تم اضافة الماركة بنجاح",
      en: "Brand added successfully",
    },
  });
});

const getBrand = asyncWrapper(async (req, res, next) => {
  const { brandId } = req.params;
  const targetBrand = await Brand.findById(brandId);
  if (!targetBrand) {
    const error = appError.create(
      {
        ar: "الماركة غير موجودة",
        en: "Brand not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!brandId) {
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
    data: { brand: targetBrand },
  });
});

const editBrand = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { brandId } = req.params;

  const targetBrand = await Brand.findById(brandId);
  if (!targetBrand) {
    const error = appError.create(
      {
        ar: "الماركة غير موجودة",
        en: "Brand not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const {
    title: { ar, en },
  } = req.body;

  const brandExist = await Brand.findOne({
    _id: { $ne: brandId },
    $or: [{ "title.ar": ar }, { "title.en": en }],
  });

  if (brandExist) {
    const error = appError.create(
      {
        ar: "الماركة موجودة بالفعل",
        en: "Brand already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const updateFields = { ...req.body };

  const updatedBrand = await Brand.findByIdAndUpdate(
    brandId,
    { $set: updateFields },
    { new: true }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { brand: updatedBrand },
    message: {
      ar: "تم تعديل الماركة بنجاح",
      en: "Brand updated successfully",
    },
  });
});

const deleteBrand = asyncWrapper(async (req, res, next) => {
  const { brandId } = req.params;
  const targetBrand = await Brand.findById(brandId);
  if (!targetBrand) {
    const error = appError.create(
      { ar: "الماركة غير موجودة", en: "Brand not found" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const hasProducts = await Product.exists({ brandId });
  if (hasProducts) {
    return res.status(400).json({
      message: {
        ar: "لا يمكن حذف الماركة لانه يحتوي على منتجات",
        en: "Cannot delete the brand because it has products",
      },
    });
  } else {
    await Brand.deleteOne({ _id: brandId });
    res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "تم حذف الماركة بنجاح",
        en: "Brand deleted successfully",
      },
      data: { brand: targetBrand },
    });
  }
});

module.exports = {
  getAllBrands,
  addBrand,
  getBrand,
  editBrand,
  deleteBrand,
};
