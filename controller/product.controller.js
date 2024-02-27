const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const { storage, fileFilter } = require("../utils/multer");
const multer = require("multer");

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const query = req.query;

  const limit = query.limit;
  const page = query.page;
  const skip = (page - 1) * limit;
  const products = await Product.find()
    .populate("productOwner")
    .limit(limit)
    .skip(skip);

  if (!products) {
    const error = appError.create(
      "No products to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { products } });
});

const getProduct = asyncWrapper(async (req, res, next) => {
  const productId = req.params.productId;
  const targetProduct = await Product.findById(productId);
  if (!productId) {
    const error = appError.create(
      "ProductId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!targetProduct) {
    const error = appError.create(
      "product n't found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { product: targetProduct } });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const { sellerId, limit, page } = req.query;
  const skip = (page - 1) * limit;
  const sellerProducts = await Product.find({ productOwner: sellerId })
    .limit(limit)
    .skip(skip);

  if (!sellerProducts) {
    const error = appError.create(
      "No products to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { products: sellerProducts },
    total: sellerProducts.length,
  });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  // }

  const newProduct = new Product({ ...req.body });

  if (req.files && req.files.length > 0) {
    // Assuming each image's filename should be stored in an array field called 'images'
    newProduct.images = req.files.map((file) => `uploads/${file?.filename}`);
  }
  if (req.body.options && Array.isArray(req.body.options)) {
    newProduct.options = req.body.options;
  }

  await newProduct.save();
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { product: newProduct },
    message: "Product added successfully",
  });
});

const editProduct = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const targetProduct = await Product.findById(productId);
  if (!targetProduct) {
    const error = appError.create(
      "Product not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  let updateFields = { ...req.body };
  const finalImages = [];

  if (updateFields?.images) {
    if (Array.isArray(updateFields?.images)) {
      updateFields?.images.map((image) => {
        finalImages.push(image);
      });
      finalImages.forEach((image, index) => {
        // Remove "http://localhost:4000" from the beginning of each image URL
        finalImages[index] = image.replace(/^http:\/\/localhost:4000\//, "");
      });
    } else {
      finalImages.push(updateFields?.images);
    }
  }

  if (req.files && req.files.length > 0) {
    req.files.map((file) => {
      finalImages.push(`uploads/${file?.filename}`);
    });
  }

  updateFields.images = finalImages;
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { product: updatedProduct },
    message: "Product updated successfully",
  });
});
const deleteProduct = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const targetProduct = await Product.findById(productId);
  if (!targetProduct) {
    const error = appError.create(
      "Product not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const deletedProduct = await Product.deleteOne({ _id: productId });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { product: targetProduct },
    message: "Product deleted successfully",
  });
});

module.exports = {
  getAllProducts,
  getProduct,
  addProduct,
  editProduct,
  deleteProduct,
  getSellerProducts,
};
