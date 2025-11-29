const { body } = require("express-validator");

const flashSaleValidation = () => {
  return [
    body("title.ar")
      .notEmpty()
      .withMessage("Arabic title is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Arabic title must be between 3 and 50 characters"),

    body("title.en")
      .notEmpty()
      .withMessage("English title is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("English title must be between 3 and 50 characters"),

    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Start date must be a valid date"),

    // 🔹 End date
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),

    body("products")
      .isArray({ min: 1 })
      .withMessage("At least one product must be included in the flash sale"),

    body("products.*.productId")
      .notEmpty()
      .withMessage("Product ID is required")
      .isMongoId()
      .withMessage("Invalid Product ID"),

    body("products.*.optionId")
      .optional({ nullable: true })
      .isMongoId()
      .withMessage("Invalid Option ID"),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ];
};

module.exports = { flashSaleValidation };
