const asyncWrapper = require("../middlewares/asyncWrapper");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const addToCart = asyncWrapper(async (req, res, next) => {
  const { user, productId, optionId, selectedQuantity } = req.body;

  if (!selectedQuantity || isNaN(selectedQuantity) || selectedQuantity <= 0) {
    const error = appError.create("Invalid quantity", 400, httpStatusText.FAIL);
    return next(error);
  }

  let cart = await Cart.findOne({ user });

  if (!cart) {
    cart = new Cart({ user });
  }

  const targetProduct = await Product.findById(productId);
  if (!targetProduct) {
    const error = appError.create(
      "Product not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetOption = targetProduct.options.find(
    (option) => option._id.toString() === optionId
  );

  if (!targetOption) {
    const error = appError.create("Option not found", 400, httpStatusText.FAIL);
    return next(error);
  }

  const subTotal = selectedQuantity * targetOption.price.finalPrice;

  const existingItemIndex = cart.products.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.option._id.toString() === optionId
  );

  if (existingItemIndex > -1) {
    cart.products[existingItemIndex].selectedCount += selectedQuantity;
    cart.products[existingItemIndex].subTotal += subTotal;
  } else {
    cart.products.push({
      product: productId,
      option: targetOption,
      selectedCount: selectedQuantity,
      subTotal: subTotal,
    });
  }

  cart.totalPriceBeforeDiscount = cart.products.reduce(
    (acc, item) =>
      acc + item.option.price.priceBeforeDiscount * item.selectedCount,
    0
  );

  cart.totalDiscount = cart.products.reduce((acc, item) => {
    const discountPerItem =
      item.option.price.priceBeforeDiscount - item.option.price.finalPrice;
    const itemDiscount = discountPerItem * item.selectedCount;

    // تأكد من أن الخصم قيمة صالحة
    if (!isNaN(itemDiscount) && itemDiscount > 0) {
      return acc + itemDiscount;
    }
    return acc;
  }, 0);

  cart.totalFinalPrice =
    cart.totalPriceBeforeDiscount - (cart.totalDiscount || 0);

  await cart.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { cart },
    message: "Item added to cart successfully",
  });
});

const getCart = asyncWrapper(async (req, res, next) => {
  const { userId } = req.query;

  if (!userId) {
    const error = appError.create(
      "User ID is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const cart = await Cart.findOne({ user: userId }).populate({
    path: "products.product",
    model: "Product",
  });

  if (!cart) {
    const error = appError.create("Cart not found", 404, httpStatusText.FAIL);
    return next(error);
  }
  cart.products.forEach((product) => {
    console.log("product: " + product);
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { cart },
  });
});

module.exports = { addToCart, getCart };
