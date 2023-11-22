const { body } = require("express-validator");
const registerValidation = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .isLength({ min: 3, max: 15 })
      .withMessage("name must be  at least 3 chars or 15 chars maximum"),
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 9, max: 25 })
      .withMessage("password length must between 9 and 25 characters "),
  ];
};

module.exports = registerValidation;
