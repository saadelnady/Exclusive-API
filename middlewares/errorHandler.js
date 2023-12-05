const httpStatusText = require("../utils/appError");

module.exports = (error, req, res, next) => {
  return res.status(400).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message,
    code: error.statusCode,
    data: null,
  });
};
