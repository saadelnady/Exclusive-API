require("dotenv").config();
const mongoose = require("mongoose");
const sellerStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  VERIFIED: "VERIFIED",
  BLOCKED: "BLOCKED",
  NOTVERIFIED: "NOTVERIFIED",
};
const Seller = require("./models/seller.model");

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    seedSellers();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const statuses = Object.values(sellerStatus);

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const createRandomSeller = (index) => {
  const phone = "01000000" + String(index).padStart(2, "0");
  const email = `user${index}@example.com`;

  const status = getRandomItem(statuses);

  return {
    name: `User ${index}`,
    mobilePhone: phone,
    email: email,
    password: "123456",
    status: status,
    image: "uploads/user-default.png",
    address: `Fake address ${index}`,
    dateOfBirth: new Date("1990-01-01"),
    verificationCode: "1234",
    verificationCodeExpires: new Date(),
    nationalId: `12345678901${index}`,
    officialDocuments: {
      frontId: `frontId${index}.png`,
      backId: `backId${index}.png`,
      taxCard: `taxCard${index}.png`,
      commercialRegister: `commercialReg${index}.png`,
      otherDocs: `otherDocs${index}.png`,
    },
    isProfileComplete: true,
    storeName: `Store ${index}`,
    paymentInfo: {
      method: "card",
      card: {
        cardHolderName: `Holder ${index}`,
        cardLast4Digits: "1234",
        cardBrand: "Visa",
        expiryDate: "12/30",
      },
    },
  };
};

const insertFakeSellers = async () => {
  try {
    await Seller.deleteMany();
    const sellers = [];

    for (let i = 1; i <= 50; i++) {
      sellers.push(createRandomSeller(i));
    }

    await Seller.insertMany(sellers);
    process.exit();
  } catch (error) {
    console.error("خطأ أثناء إدخال البيانات:", error);
    process.exit(1);
  }
};

insertFakeSellers();
