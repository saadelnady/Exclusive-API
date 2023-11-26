const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const products = await product.find();

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
const getProduct = asyncWrapper(async (req, res, next) => {});

const addProduct = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const newProduct = new product({ ...req.body });
  newProduct.productImage = req.file.filename;
  newProduct.save();
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
