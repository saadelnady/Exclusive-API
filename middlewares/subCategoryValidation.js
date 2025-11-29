const { body } = require("express-validator");

const addSubCategoryValidation = () => {
  return [
    body("title.ar")
      .notEmpty()
      .withMessage("Arabic title is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("Arabic title must be between 5 and 20 characters"),

    body("title.en")
      .notEmpty()
      .withMessage("English title is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("English title must be between 5 and 20 characters"),
  ];
};

const editSubCategoryValidation = () => {
  return [
    body("title.ar")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("Arabic title must be between 5 and 20 characters"),

    body("title.en")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("English title must be between 5 and 20 characters"),
  ];
};

module.exports = { addSubCategoryValidation, editSubCategoryValidation };
