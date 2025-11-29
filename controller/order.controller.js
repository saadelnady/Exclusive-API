const mongoose = require("mongoose");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utils/appError.js");
const Order = require("../models/order.model.js");
const Seller = require("../models/seller.model.js");
const { escapeRegex } = require("../utils/utils.js");
const { httpStatusText, orderStatus } = require("../utils/constants.js");

const createOrder = asyncWrapper(async (req, res, next) => {
  const { products, seller, user, shippingAddress, payment } = req.body;

  if (!products || !products.length) {
    const error = appError.create(
      { ar: "لا يوجد منتجات فى الأوردر", en: "No products in the order" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const totalAmount = products.reduce((acc, item) => {
    const quantity = item.quantity || 1;
    const price = item.price;
    return acc + price * quantity;
  }, 0);

  const order = await Order.create({
    user,
    seller,
    products,
    totalAmount,
    shippingAddress,
    payment,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { order },
  });
});

const getAllOrders = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  let searchQuery = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery = {
      $or: [
        { status: regex },
        mongoose.Types.ObjectId.isValid(text)
          ? { _id: new mongoose.Types.ObjectId(text) }
          : null,
      ].filter(Boolean),
    };
  }

  const [orders, totalOrdersCount] = await Promise.all([
    Order.find(searchQuery)
      .populate("user", "name email")
      .populate("seller", "storeName email")
      .populate("products.product", "title options")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }),
    Order.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      orders,
      total: totalOrdersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalOrdersCount / limit),
    },
  });
});

const getUserOrders = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = appError.create(
      { ar: "المستخدم غير صالح", en: "Invalid user ID" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  let searchQuery = { user: userId };

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery = {
      user: userId,
      $or: [
        { status: regex },
        mongoose.Types.ObjectId.isValid(text)
          ? { _id: new mongoose.Types.ObjectId(text) }
          : null,
      ].filter(Boolean),
    };
  }

  const [orders, totalOrdersCount] = await Promise.all([
    Order.find(searchQuery)
      .populate("seller", "storeName email")
      .populate("products.product", "title options")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }),
    Order.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      orders,
      total: totalOrdersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalOrdersCount / limit),
    },
  });
});

const getSellerOrders = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    const error = appError.create(
      { ar: "معرّف البائع غير صالح", en: "Invalid seller ID" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const targetSeller = await Seller.findById(sellerId);

  if (!targetSeller) {
    const error = appError.create(
      { ar: "البائع غير موجود", en: "Seller not found" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  let searchQuery = { seller: sellerId };

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery = {
      seller: sellerId,
      $or: [
        { status: regex },
        mongoose.Types.ObjectId.isValid(text)
          ? { _id: new mongoose.Types.ObjectId(text) }
          : null,
      ].filter(Boolean),
    };
  }

  const [orders, totalOrdersCount] = await Promise.all([
    Order.find(searchQuery)
      .populate("user", "name email")
      .populate("products.product", "title options")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }),
    Order.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      orders,
      total: totalOrdersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalOrdersCount / limit),
    },
  });
});

const updateOrderStatus = asyncWrapper(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!Object.values(orderStatus).includes(status)) {
    const error = appError.create(
      { ar: "حالة غير صالحة", en: "Invalid status" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const error = appError.create(
      { ar: "الأوردر غير موجود", en: "Order not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  order.status = status;
  await order.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { order },
    message: { ar: "تم تحديث حالة الأوردر", en: "Order status updated" },
  });
});

module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
};
