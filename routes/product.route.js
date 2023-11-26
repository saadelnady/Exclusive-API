const express = require("express");

const {
  getAllProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
} = require("../controller/product.controller");
const productValidation = require("../middlewares/productValidation");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const multer = require("multer");

const diskStorage = multer.diskStorage({
  // choose images file direction
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    // get img extention
    const extention = file.mimetype.split("/")[1];

    // handle image to make it unique handle every img extention
    const fileName = `product-${Date.now()}.${extention}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  // check the type of uploaded file is an image
  const imageType = file.mimetype.split("/")[0];
  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(
      appError.create("this file must be an image", 400, httpStatusText.FAIL),
      false
    );
  }
};
const upload = multer({ storage: diskStorage, fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAllProducts)
  .post(upload.single("productImage"), productValidation(), addProduct);

Router.route("/:productId")
  .get(getProduct)
  .put(editProduct)
  .delete(deleteProduct);

module.exports = Router;
