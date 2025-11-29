const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Offer = require("../models/offer.model");
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const { httpStatusText, productStatus } = require("../utils/constants");
const { escapeRegex } = require("../utils/utils");

const getOffers = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const text = req.query.text;

  const searchQuery = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };
    searchQuery.$or = [{ "title.ar": regex }, { "title.en": regex }];
  }

  const [offers, totalOffersCount] = await Promise.all([
    Offer.find(searchQuery)
      .populate("productId", "title status options")
      .limit(limit)
      .skip(skip)
      .sort({ priority: -1, createdAt: -1 }),
    Offer.countDocuments(searchQuery),
  ]);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      offers,
      total: totalOffersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalOffersCount / limit),
    },
  });
});

// جلب عرض واحد
const getOffer = asyncWrapper(async (req, res, next) => {
  const { offerId } = req.params;
  const offer = await Offer.findById(offerId).populate(
    "productId",
    "title status options"
  );

  if (!offer) {
    const error = appError.create(
      { ar: "العرض غير موجود", en: "Offer not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { offer },
  });
});

const addOffer = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const {
    productId,
    optionId,
    title,
    subtitle,
    sellerId,
    image,
    finalPrice,
    cta_text,
    start_date,
    end_date,
  } = req.body;

  // التأكد من البائع
  const seller = await Seller.findById(sellerId);
  if (!seller) {
    const error = appError.create(
      { ar: "البائع غير موجود", en: "Seller not found" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // التأكد من المنتج
  const product = await Product.findById(productId);
  if (!product || product.status !== productStatus.ACCEPTED) {
    const error = appError.create(
      {
        ar: "المنتج غير موجود أو لم يتم قبوله",
        en: "Product not found or not accepted",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // التأكد من إن الـ option موجود داخل المنتج
  const targetOption = product.options.id(optionId);
  if (!targetOption) {
    const error = appError.create(
      { ar: "الخيار غير موجود في المنتج", en: "Option not found in product" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // التأكد من ملكية البائع للمنتج
  if (product.sellerId.toString() !== sellerId) {
    const error = appError.create(
      {
        ar: "الخيار لا ينتمي للبائع",
        en: "Option does not belong to the seller",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // إنشاء العرض
  const newOffer = new Offer({
    sellerId,
    productId,
    optionId,
    title,
    subtitle,
    image,
    finalPrice,
    cta_text,
    start_date,
    end_date,
    is_active: false, // يبدأ pending
  });

  await newOffer.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { offer: newOffer },
    message: { ar: "تم إضافة العرض بنجاح", en: "Offer added successfully" },
  });
});

// تعديل عرض
const editOffer = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { offerId } = req.params;
  const targetOffer = await Offer.findById(offerId);

  if (!targetOffer) {
    const error = appError.create(
      { ar: "العرض غير موجود", en: "Offer not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // لو البائع مش هو مالك العرض ماينفعش يعدل
  if (
    req.current.role === "SELLER" &&
    targetOffer.sellerId.toString() !== req.current.id
  ) {
    const error = appError.create(
      { ar: "لا يمكنك تعديل هذا العرض", en: "You can't edit this offer" },
      403,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const updatedOffer = await Offer.findByIdAndUpdate(
    offerId,
    { $set: { ...req.body } },
    { new: true }
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { offer: updatedOffer },
    message: { ar: "تم تعديل العرض بنجاح", en: "Offer updated successfully" },
  });
});

// حذف عرض
const deleteOffer = asyncWrapper(async (req, res, next) => {
  const { offerId } = req.params;
  const targetOffer = await Offer.findById(offerId);

  if (!targetOffer) {
    const error = appError.create(
      { ar: "العرض غير موجود", en: "Offer not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // لو البائع مش هو مالك العرض ماينفعش يحذفه
  if (
    req.current.role === "SELLER" &&
    targetOffer.sellerId.toString() !== req.current.id
  ) {
    const error = appError.create(
      { ar: "لا يمكنك حذف هذا العرض", en: "You can't delete this offer" },
      403,
      httpStatusText.FAIL
    );
    return next(error);
  }

  await Offer.deleteOne({ _id: offerId });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: { ar: "تم حذف العرض بنجاح", en: "Offer deleted successfully" },
    data: { offer: targetOffer },
  });
});

// جلب العروض الخاصة بالبائع الحالي مع Pagination
const getSellerOffers = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const text = req.query.text;

  const searchQuery = { sellerId: req.current.id };

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };
    searchQuery.$or = [{ "title.ar": regex }, { "title.en": regex }];
  }

  const [offers, totalOffersCount] = await Promise.all([
    Offer.find(searchQuery)
      .populate("productId", "title status options")
      .limit(limit)
      .skip(skip)
      .sort({ priority: -1, createdAt: -1 }),
    Offer.countDocuments(searchQuery),
  ]);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      offers,
      total: totalOffersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalOffersCount / limit),
    },
  });
});

module.exports = {
  getOffers,
  getOffer,
  addOffer,
  editOffer,
  deleteOffer,
  getSellerOffers,
};
