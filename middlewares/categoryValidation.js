const { body } = require("express-validator");

module.exports = () => {
  return [
    body("categoryTitle")
      .notEmpty()
      .withMessage("categoryImage is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("name must be  at least 3 chars or 20 chars maximum"),
  ];
};
