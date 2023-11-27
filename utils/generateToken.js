require("dotenv").config();
const jwt = require("jsonwebtoken");

const generateToken = async (payLoad) => {
  const token = await jwt.sign(payLoad, process.env.jwt_secret_key, {
    expiresIn: "10m",
  });
  return token;
};
module.exports = generateToken;
