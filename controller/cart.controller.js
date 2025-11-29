const asyncWrapper = require("../middlewares/asyncWrapper");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const { calculateCartTotal } = require("../utils/utils");
const { httpStatusText } = require("../utils/constants");
const mongoose = require("mongoose");

// ============================================================================

const addToCart = asyncWrapper(async (req, res, next) => {
  const { user, productId, optionId, newSelectedCount } = req.body;

  if (!newSelectedCount || isNaN(newSelectedCount) || newSelectedCount <= 0) {
    return next(appError.create("Invalid quantity", 400, httpStatusText.FAIL));
  }

  let cart = await Cart.findOne({ user });
  if (!cart) {
    cart = new Cart({ user });
  }

  const targetProduct = await Product.findById(productId);
  if (!targetProduct) {
    return next(appError.create("Product not found", 400, httpStatusText.FAIL));
  }

  const targetOption = targetProduct.options.find(
    (option) => option._id.toString() === optionId
  );

  if (!targetOption) {
    return next(
      appError.create(
        "Product option not found (color/size/etc.)",
        400,
        httpStatusText.FAIL
      )
    );
  }

  const subTotal = newSelectedCount * targetOption.price.finalPrice;

  const existingItemIndex = cart.products.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.option.optionId.toString() === optionId
  );

  if (existingItemIndex > -1) {
    if (
      cart.products[existingItemIndex].selectedCount + newSelectedCount >
      targetOption.stockCount
    ) {
      return next(
        appError.create(
          {
            ar: "لقد تجاوزت الكمية المتوفرة",
            en: "You have reached the stock count",
          },
          400,
          httpStatusText.FAIL
        )
      );
    }

    cart.products[existingItemIndex].selectedCount += newSelectedCount;
    cart.products[existingItemIndex].subTotal += subTotal;
  } else {
    if (newSelectedCount > targetOption.stockCount) {
      return next(
        appError.create(
          {
            ar: "لقد تجاوزت الكمية المتوفرة",
            en: "You have reached the stock count",
          },
          400,
          httpStatusText.FAIL
        )
      );
    }

    cart.products.push({
      product: productId,
      option: {
        optionId: targetOption._id,
        images: targetOption.images,
        attributes: targetOption.attributes,
        stockCount: targetOption.stockCount,
        price: targetOption.price,
      },
      selectedCount: newSelectedCount,
      subTotal: subTotal,
    });
  }

  calculateCartTotal(cart);
  await cart.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { cart },
    message: {
      ar: "تم إضافة المنتج إلى السلة بنجاح",
      en: "Product added to cart successfully",
    },
  });
});

// ============================================================================

const getCart = asyncWrapper(async (req, res, next) => {
  const { userId } = req.query;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const error = appError.create(
      { ar: "المستخدم غير صالح", en: "Invalid user ID" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  let targetCart = await Cart.findOne({ user: userId });

  if (!targetCart) {
    targetCart = new Cart({ user: userId });
  }

  let cart = await targetCart.populate({
    path: "products.product",
  });

  cart.products = cart.products.filter((item) => item.product !== null);

  calculateCartTotal(cart);

  const simplifiedProducts = cart.products.map((item) => {
    const productData = item.product.toObject();
    delete productData.options;
    return {
      ...productData,
      selectedOption: item.option,
      selectedCount: item.selectedCount,
      subTotal: item.subTotal,
      cartItemId: item._id,
    };
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      cart: {
        products: simplifiedProducts,
        totalFinalPrice: cart.totalFinalPrice,
        subTotal: cart.totalPriceBeforeDiscount,
        totalPriceBeforeDiscount: cart.totalPriceBeforeDiscount,
        totalDiscount: cart.totalDiscount,
        shipping: cart.shipping,
        _id: cart._id,
      },
    },
  });
});

// ============================================================================
const editCart = asyncWrapper(async (req, res, next) => {
  const { cartId } = req.params;
  const { productId, newSelectedCount } = req.body;

  const targetCart = await Cart.findById(cartId).populate({
    path: "products.product",
    model: "Product",
  });
  if (!targetCart) {
    const error = appError.create(
      {
        ar: "السلة غير موجودة",
        en: "Cart not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const productIndex = targetCart.products.findIndex(
    (product) => product.product._id.toString() === productId
  );

  if (productIndex === -1) {
    const error = appError.create(
      {
        ar: "المنتج غير موجود فى سلة المشتريات",
        en: "Product not found in cart",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (
    newSelectedCount > 0 &&
    targetCart.products[productIndex].option.stockCount > newSelectedCount
  ) {
    targetCart.products[productIndex].selectedCount = newSelectedCount;
    targetCart.products[productIndex].subTotal =
      newSelectedCount *
      targetCart.products[productIndex].option.price.finalPrice;
  } else {
    const error = appError.create(
      {
        ar: `لقد تجاوزت الكمية المتوفرة فى المنتج   ${targetCart.products[productIndex].product.title}`,
        en: `You have exceeded the available quantity of the product  ${targetCart.products[productIndex].product.title}`,
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  calculateCartTotal(targetCart);
  await targetCart.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      cart: targetCart,
      message: {
        ar: "تم تحديث سلة المشتريات بنجاح",
        en: "Cart updated successfully",
      },
    },
  });
});

// ============================================================================
const deleteProductFromCart = asyncWrapper(async (req, res, next) => {
  const { cartId } = req.params;
  const { productId } = req.body;

  const targetCart = await Cart.findById(cartId);
  if (!targetCart)
    return next(
      appError.create(
        { ar: "سلة المشتريات غير موجودة", en: "Cart not found" },
        400,
        httpStatusText.FAIL
      )
    );

  const productIndex = targetCart.products.findIndex(
    (product) => product.product._id.toString() === productId
  );

  if (productIndex === -1)
    return next(
      appError.create(
        {
          ar: "المنتج غير موجود فى سلة المشتريات",
          en: "Product not found in cart",
        },
        400,
        httpStatusText.FAIL
      )
    );

  targetCart.products.splice(productIndex, 1);
  calculateCartTotal(targetCart);
  await targetCart.save();

  const cart = await targetCart.populate({
    path: "products.product",
    model: "Product",
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم حذف المنتج من سلة المشتريات بنجاح",
      en: "Product deleted from cart successfully",
    },
    data: { cart },
  });
});

module.exports = {
  addToCart,
  getCart,
  editCart,
  deleteProductFromCart,
};
