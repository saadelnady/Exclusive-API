const { body } = require("express-validator");

const brandValidation = () => {
  return [
    body("title.ar")
      .notEmpty()
      .withMessage("Arabic title is required")
      .isLength({ max: 20 })
      .withMessage("Arabic title must be between 5 and 20 characters"),

    body("title.en")
      .notEmpty()
      .withMessage("English title is required")
      .isLength({ max: 20 })
      .withMessage("English title must be between 5 and 20 characters"),
  ];
};

module.exports = { brandValidation };
