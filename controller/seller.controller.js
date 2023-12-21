const asyncWrapper = require("../middlewares/asyncWrapper");
const Seller = require("../models/seller.model");

const sellerRegister = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, mobilePhone, password } = req.body;

  const newSeller = new Seller({
    firstName,
    lastName,
    email,
    mobilePhone,
    password,
  });
  await newSeller.save();
  console.log("saaadoooola");
  return res.json({ status: 201 });
});

module.exports = { sellerRegister };
