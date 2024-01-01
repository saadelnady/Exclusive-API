const { body } = require("express-validator");
const updateValidation = () => {
  return [
    body("firstName")
      .isLength({ min: 3, max: 20 })
      .withMessage("name must be  at least 3 chars or 20 chars maximum"),

    body("lastName")
      .isLength({ min: 3, max: 20 })
      .withMessage("name must be  at least 3 chars or 20 chars maximum"),

    body("email")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("password")
      .isLength({ min: 9, max: 25 })
      .withMessage("password length must between 9 and 25 characters "),

    body("mobilePhone")
      .isMobilePhone("any")
      .withMessage("Invalid mobile phone number"),
  ];
};

module.exports = updateValidation;
