const asyncWrapper = require("../middlewares/asyncWrapper");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const { calculateCartTotal } = require("../helpers/calculateCartTotal");

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
  // لو ال product موجود فى الcart
  if (existingItemIndex > -1) {
    if (
      cart.products[existingItemIndex].selectedCount + selectedQuantity >
      cart.products[existingItemIndex].option.stockCount
    ) {
      const error = appError.create(
        "you have reached the stock count",
        400,
        httpStatusText.FAIL
      );
      return next(error);
    } else {
      cart.products[existingItemIndex].selectedCount += selectedQuantity;
      cart.products[existingItemIndex].subTotal += subTotal;
    }
  } else {
    // لو الproduct مش موجود فى الcart
    if (selectedQuantity > targetOption.stockCount) {
      const error = appError.create(
        "you have reached the stock count",
        400,
        httpStatusText.FAIL
      );
      return next(error);
    } else {
      cart.products.push({
        product: productId,
        option: targetOption,
        selectedCount: selectedQuantity,
        subTotal: subTotal,
      });
    }
  }

  calculateCartTotal(cart);
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

  let targetCart = await Cart.findOne({ user: userId });

  if (!targetCart) {
    targetCart = new Cart({ user: userId });
  }
  const cart = await targetCart.populate({
    path: "products.product",
    model: "Product",
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { cart },
  });
});
// const editCart = asyncWrapper(async (req, res, next) => {
//   const { userId } = req.query;

//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     // data: { cart },
//   });
// });
const deleteProductFromCart = asyncWrapper(async (req, res, next) => {
  const { cartId, productId } = req.query;

  console.log("cartId ===>", cartId);
  console.log("productId ===>", productId);

  // Find the cart by ID
  const targetCart = await Cart.findById(cartId);
  if (!targetCart) {
    const error = appError.create("Cart not found", 400, httpStatusText.FAIL);
    return next(error);
  }

  // Find the product in the cart's products array and remove it
  const productIndex = targetCart.products.findIndex(
    (product) => product._id.toString() === productId
  );

  if (productIndex === -1) {
    const error = appError.create(
      "Product not found in cart",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // Remove the product from the cart
  targetCart.products.splice(productIndex, 1);

  calculateCartTotal(targetCart);
  // Save the updated cart
  await targetCart.save();
  const cart = await targetCart.populate({
    path: "products.product",
    model: "Product",
  });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product deleted successfully from your cart",
    data: { cart },
  });
});

module.exports = {
  addToCart,
  getCart,
  //  editCart,
  deleteProductFromCart,
};
