const { body } = require("express-validator");

const contactValidation = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Name must be between 3 and 50 characters"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),

    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 10, max: 500 })
      .withMessage("Message must be between 10 and 500 characters"),
  ];
};

module.exports = { contactValidation };
