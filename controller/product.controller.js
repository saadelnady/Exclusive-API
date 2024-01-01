const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const { configureMulter, fileFilter } = require("../utils/multer");
const multer = require("multer");

const upload = multer({ storage: configureMulter("products"), fileFilter });

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const products = await Product.find();

  if (!products) {
    const error = appError.create(
      "No products to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  products.forEach((product) => {
    product.productImage = `${process.env.BAIS_URL}/${product.productImage}`;
  });

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { products } });
});

const getProduct = asyncWrapper(async (req, res, next) => {
  const productId = req.params.productId;

  if (!productId) {
    const error = appError.create(
      "ProductId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const targetProduct = await Product.findById(productId);

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { product: targetProduct } });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const newProduct = new product({ ...req.body });
  newProduct.productImage = req.file.filename;
  return res
    .status(201)
    .json({ status: httpStatusText.SUCCESS, data: { product: newProduct } });
});

const editProduct = asyncWrapper(async () => {});
const deleteProduct = asyncWrapper(async () => {});

module.exports = {
  getAllProducts,
  getProduct,
  addProduct,
  editProduct,
  deleteProduct,
};
