const asyncWrapper = require("../middlewares/asyncWrapper");
const WishList = require("../models/wishlist.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");

const addToWishlist = asyncWrapper(async (req, res, next) => {
  const { userId, productId } = req.body;

  const productExists = await Product.findById(productId);
  if (!productExists) {
    return next(
      appError.create(
        { ar: "المنتج غير موجود", en: "Product not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  let wishlist = await WishList.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new WishList({ user: userId, products: [] });
  }

  const alreadyExists = wishlist.products.find(
    (item) => item.toString() === productId
  );

  if (alreadyExists) {
    return next(
      appError.create(
        {
          ar: " المنتج موجود بالفعل فى قائمة المفضلة",
          en: "Product already exists in the wishlist",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  // هنا التعديل 👇
  wishlist.products.push(productId);
  await wishlist.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      wishlist,
    },
    message: {
      ar: "تم اضافة المنتج الى قائمة المفضلة بنجاح",
      en: "Product added to wishlist successfully",
    },
  });
});

// ============================================================================
const getWishList = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  if (!userId) {
    const error = appError.create(
      {
        ar: "المستخدم غير صالح",
        en: "Invalid user ID",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  let targetWishList = await WishList.findOne({ user: userId }).populate({
    path: "products",
    model: "Product",
    select: "title description options status",
  });

  if (!targetWishList) {
    targetWishList = new WishList({ user: userId });
    await targetWishList.save();
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { targetWishList },
  });
});

// ============================================================================
const deleteProductFromWishList = asyncWrapper(async (req, res, next) => {
  const { productId } = req.body;
  const { userId } = req.params;

  const wishlist = await WishList.findOne({ user: userId });
  if (!wishlist) {
    return next(
      appError.create(
        { ar: "قائمة المفضلة غير موجودة", en: "Wishlist not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  // هنا products عبارة عن array of ObjectId مش object
  wishlist.products = wishlist.products.filter(
    (item) => item.toString() !== productId
  );

  await wishlist.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      wishlist,
    },
    message: {
      ar: "تم حذف المنتج من قائمة المفضلة بنجاح",
      en: "Product removed from wishlist successfully",
    },
  });
});

// ============================================================================

module.exports = {
  addToWishlist,
  getWishList,
  deleteProductFromWishList,
};
