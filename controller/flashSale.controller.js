const mongoose = require("mongoose");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const FlashSale = require("../models/flashSale.model");
const { escapeRegex } = require("../utils/utils");

// ==========================================================
const getAllFlashSales = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const text = req.query.text;
  const isActive = req.query.isActive;

  const query = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };
    query.$or = [{ "title.ar": regex }, { "title.en": regex }];
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const [flashSales, totalCount] = await Promise.all([
    FlashSale.find(query, { __v: 0 })
      .populate("products.productId")
      .populate("products.optionId")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }),
    FlashSale.countDocuments(query),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      flashSales,
      total: totalCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});

// ==========================================================
const getActiveFlashSale = asyncWrapper(async (req, res, next) => {
  const flashSale = await FlashSale.find({ isActive: true }, { __v: 0 })
    .populate("products.productId")
    .populate("products.optionId");

  if (!flashSale) {
    return next(
      appError.create(
        { ar: " لا يوجد عرض مفعل", en: " There is no active flash sale" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale },
  });
});

// ==========================================================
const getFlashSale = asyncWrapper(async (req, res, next) => {
  const { flashSaleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(flashSaleId)) {
    return next(
      appError.create("Invalid flash sale ID", 400, httpStatusText.FAIL)
    );
  }

  const flashSale = await FlashSale.findById(flashSaleId)
    .populate("products.productId")
    .populate("products.optionId");

  if (!flashSale) {
    return next(
      appError.create(
        { ar: "العرض غير موجود", en: "Flash sale not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale },
  });
});
// ==========================================================
// 🔹 Add Flash Sale
const addFlashSale = asyncWrapper(async (req, res, next) => {
  const { title, startDate, endDate, products } = req.body;

  if (!title?.ar || !title?.en || !startDate || !endDate) {
    return next(
      appError.create(
        {
          ar: "يرجى إدخال جميع البيانات المطلوبة",
          en: "All fields are required",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const newFlashSale = new FlashSale({
    title,
    startDate,
    endDate,
    products,
  });

  await newFlashSale.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale: newFlashSale },
    message: {
      ar: "تم إضافة عرض الفلاش بنجاح",
      en: "Flash sale added successfully",
    },
  });
});

// ==========================================================
// 🔹 Edit Flash Sale
const editFlashSale = asyncWrapper(async (req, res, next) => {
  const { flashSaleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(flashSaleId)) {
    return next(
      appError.create("Invalid flash sale ID", 400, httpStatusText.FAIL)
    );
  }

  const updatedFlashSale = await FlashSale.findByIdAndUpdate(
    flashSaleId,
    { $set: req.body },
    { new: true }
  )
    .populate("products.productId")
    .populate("products.optionId");

  if (!updatedFlashSale) {
    return next(
      appError.create(
        { ar: "العرض غير موجود", en: "Flash sale not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale: updatedFlashSale },
    message: {
      ar: "تم تعديل العرض بنجاح",
      en: "Flash sale updated successfully",
    },
  });
});

// ==========================================================
// 🔹 Delete Flash Sale
const deleteFlashSale = asyncWrapper(async (req, res, next) => {
  const { flashSaleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(flashSaleId)) {
    return next(
      appError.create("Invalid flash sale ID", 400, httpStatusText.FAIL)
    );
  }

  const deletedFlashSale = await FlashSale.findByIdAndDelete(flashSaleId);

  if (!deletedFlashSale) {
    return next(
      appError.create(
        { ar: "العرض غير موجود", en: "Flash sale not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale: deletedFlashSale },
    message: {
      ar: "تم حذف العرض بنجاح",
      en: "Flash sale deleted successfully",
    },
  });
});
// ==========================================================
// 🔹 Add Product to existing Flash Sale
const addProductToFlashSale = asyncWrapper(async (req, res, next) => {
  const { flashSaleId } = req.params;
  const { productId, optionId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(flashSaleId)) {
    return next(
      appError.create("Invalid flash sale ID", 400, httpStatusText.FAIL)
    );
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(
      appError.create("Invalid product ID", 400, httpStatusText.FAIL)
    );
  }
  if (optionId && !mongoose.Types.ObjectId.isValid(optionId)) {
    return next(appError.create("Invalid option ID", 400, httpStatusText.FAIL));
  }

  const flashSale = await FlashSale.findById(flashSaleId);

  if (!flashSale) {
    return next(
      appError.create(
        { ar: "العرض غير موجود", en: "Flash sale not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  const existingProduct = flashSale.products.find(
    (p) =>
      p.productId.toString() === productId &&
      ((optionId && p.optionId?.toString() === optionId) || !optionId)
  );

  if (existingProduct) {
    return next(
      appError.create(
        {
          ar: "المنتج موجود بالفعل في الفلاش سيل",
          en: "Product already in flash sale",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  flashSale.products.push({ productId, optionId: optionId || null });
  await flashSale.save();

  const populatedFlashSale = await flashSale
    .populate("products.productId")
    .populate("products.optionId");

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale: populatedFlashSale },
    message: {
      ar: "تم إضافة المنتج إلى الفلاش سيل بنجاح",
      en: "Product added to flash sale successfully",
    },
  });
});

// ==========================================================
module.exports = {
  getAllFlashSales,
  getActiveFlashSale,
  getFlashSale,
  addFlashSale,
  editFlashSale,
  deleteFlashSale,
  addProductToFlashSale,
};
