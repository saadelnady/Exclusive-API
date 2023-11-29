const { body } = require("express-validator");
const registerValidation = () => {
  return [
    body("firstName")
      .notEmpty()
      .withMessage("first name is required")
      .isLength({ min: 3, max: 10 })
      .withMessage("name must be  at least 3 chars or 10 chars maximum"),

    body("lastName")
      .notEmpty()
      .withMessage("last name is required")
      .isLength({ min: 3, max: 10 })
      .withMessage("name must be  at least 3 chars or 10 chars maximum"),

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

    body("mobile")
      .notEmpty()
      .withMessage("mobile phone is required")
      .isMobilePhone("any")
      .withMessage("Invalid mobile phone number"),
  ];
};

module.exports = registerValidation;
