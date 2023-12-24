const { body } = require("express-validator");
const loginValidation = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("password").notEmpty().withMessage("password is required"),
  ];
};

module.exports = loginValidation;
