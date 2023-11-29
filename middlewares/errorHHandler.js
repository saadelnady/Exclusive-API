module.exports = (error, req, res, next) => {
  return res.status(error.statusCode).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message,
    code: error.statusCode,
    data: null,
  });
};
