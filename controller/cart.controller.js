const asyncWrapper = require("../middlewares/asyncWrapper");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const addToCart = asyncWrapper(async (req, res, next) => {
  const { productId, quantity, size, color, userId } = req.body;

  // Fetch the product details from the database
  const targetProduct = await Product.findById(productId);

  if (!targetProduct) {
    const error = appError.create(
      "Product not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // Check if the user already has a cart, if not, create a new cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  // Check if there is an existing cart item with the same product ID but different color or size
  const existingCartItemIndex = cart.items.findIndex(
    (item) =>
      item.product.equals(productId) &&
      (item.size !== size || item.color !== color)
  );

  if (existingCartItemIndex !== -1) {
    // Add the new item as a separate entry in the cart
    const totalPrice =
      targetProduct.options.find(
        (option) => option.size === size && option.color === color
      ).price.finalPrice * quantity;

    const cartItem = {
      product: productId,
      quantity,
      totalPrice,
      size,
      color,
    };

    cart.items.push(cartItem);
  } else {
    // Check if the item already exists in the cart based on product, size, and color
    const existingCartItem = cart.items.find(
      (item) =>
        item.product.equals(productId) &&
        item.size === size &&
        item.color === color
    );

    if (existingCartItem) {
      // Update quantity if item already exists
      existingCartItem.quantity += quantity;
      existingCartItem.totalPrice += quantity * existingCartItem.price;
    } else {
      // Calculate the total price for the item
      const totalPrice =
        targetProduct.options.find(
          (option) => option.size === size && option.color === color
        ).price.finalPrice * quantity;

      // Create a new cart item object
      const cartItem = {
        product: productId,
        quantity,
        totalPrice,
        size,
        color,
      };

      // Add the cart item to the cart
      cart.items.push(cartItem);
    }
  }

  // Update total items and total price in the cart
  cart.totalItems = cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  cart.totalPrice = cart.items.reduce(
    (total, item) => total + item.totalPrice,
    0
  );

  await cart.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { cart },
    message: "Item added to cart successfully",
  });
});

const getCart = asyncWrapper(async (req, res, next) => {
  const { userId } = req.query;

  console.log("userId", userId);
  // Fetch the user's cart and populate the items with product details
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    model: "Product",
  });

  if (!cart) {
    const error = appError.create("Cart not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { cart },
    message: "Cart retrieved successfully",
  });
});

module.exports = { addToCart, getCart };
