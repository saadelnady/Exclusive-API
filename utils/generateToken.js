const jwt = require("jsonwebtoken");
require("dotenv").config();
const generateToken = async (payLoad) => {
  const token = await jwt.sign(payLoad, process.env.jwt_secret_key, {
    expiresIn: "10m",
  });
  return token;
};
module.exports = generateToken;
