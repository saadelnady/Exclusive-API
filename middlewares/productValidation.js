const { body } = require("express-validator");

module.exports = () => {
  return [
    body("productName")
      .notEmpty()
      .withMessage("product name is required")
      .isLength({ min: 3, max: 25 })
      .withMessage("product name must be between 3 and 25 digits"),

    body("priceBeforeDiscount")
      .notEmpty()
      .withMessage("Price before discount is required")
      .isNumeric()
      .withMessage("Price should be a number")
      .isFloat({ min: 5, max: 10000 })
      .withMessage("Price should be between 5 and 10000"),

    body("productDescription")
      .notEmpty()
      .withMessage("product Description discount is required")
      .isLength({ min: 3 })
      .withMessage("product description must be 3 digits at least"),

    body("category").notEmpty().withMessage("product category is required"),
  ];
};
