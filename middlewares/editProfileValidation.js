const { body } = require("express-validator");

const editProfileValidation = () => {
  return [
    body("firstName")
      .isLength({ min: 3, max: 20 })
      .withMessage("first name must be  at least 3 chars or 20 chars maximum"),

    body("lastName")
      .isLength({ min: 3, max: 20 })
      .withMessage("name must be  at least 3 chars or 20 chars maximum"),

    body("email").isEmail().withMessage("Please provide a valid email"),

    body("mobilePhone")
      .isMobilePhone("any")
      .withMessage("Invalid mobile phone number"),

    body("address")
      .optional()
      .isLength({ min: 5, max: 100 })
      .withMessage(
        "Address must be at least 5 characters and at most 100 characters"
      ),

    body("currentPassword")
      .optional()
      .isLength({ min: 9, max: 25 })
      .withMessage(
        "Current password length must be between 9 and 25 characters"
      ),

    body("newPassword")
      .optional()
      .isLength({ min: 9, max: 25 })
      .withMessage("New password length must be between 9 and 25 characters"),
  ];
};

module.exports = { editProfileValidation };
