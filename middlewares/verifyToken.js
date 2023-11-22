require("dotenv").config();
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeaders = req.headers.authorization || req.headers.Authorization;
  const token = authHeaders.split(" ")[1];

  if (!token) {
    const error = appError.create(
      "token is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  try {
    const currentUser = jwt.verify(token, process.env.jwt_secret_key);
    req.currentUser = currentUser;
    next();
  } catch (err) {
    const error = appError.create("invalid token", 400, httpStatusText.ERROR);
    console.log(error);
    return next(error);
  }
};
module.exports = verifyToken;
