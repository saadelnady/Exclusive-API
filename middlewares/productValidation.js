const { body } = require("express-validator");

module.exports = (isEdit = false) => {
  const validationRules = [
    body("title")
      .notEmpty()
      .withMessage("Product title is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Product title must be between 3 and 50 characters"),

    body("description")
      .notEmpty()
      .withMessage("Product description is required")
      .isLength({ min: 10 })
      .withMessage("Product description must be at least 10 characters"),

    body("images")
      .isArray({ min: 1 })
      .withMessage("At least one image is required"),

    body("category")
      .notEmpty()
      .withMessage("Product category is required")
      .isMongoId()
      .withMessage("Invalid category ID"),

    body("subCategory")
      .notEmpty()
      .withMessage("Product subcategory is required")
      .isMongoId()
      .withMessage("Invalid subcategory ID"),

    body("productOwner")
      .notEmpty()
      .withMessage("Product owner is required")
      .isMongoId()
      .withMessage("Invalid product owner ID"),
  ];

  // Additional validation rules for creation
  if (!isEdit) {
    validationRules.push(
      body("options.*.size")
        .optional()
        .notEmpty()
        .withMessage("Product option size is required"),

      body("options.*.color")
        .optional()
        .notEmpty()
        .withMessage("Product option color is required"),

      body("options.*.stockCount")
        .optional()
        .isInt({ min: 0 })
        .withMessage(
          "Product option stock count must be a non-negative integer"
        ),

      body("options.*.price.priceBeforeDiscount")
        .optional()
        .notEmpty()
        .withMessage("Product option price before discount is required")
        .isNumeric()
        .withMessage("Product option price must be a number"),

      body("options.*.price.discountPercentage")
        .optional()
        .isNumeric()
        .withMessage("Product option discount percentage must be a number"),

      body("options.*.price.discountValue")
        .optional()
        .isNumeric()
        .withMessage("Product option discount value must be a number")
    );
  }

  return validationRules;
};
