const multer = require("multer");
const appError = require("./appError");
const httpStatusText = require("../utils/utils");
const configureMulter = (folderName) => {
  const storage = multer.diskStorage({
    // choose file direction based on folderName
    // cb refer to callback
    destination: function (req, file, cb) {
      // callback(error , where we saving data)
      cb(null, `uploads/${folderName}`);
    },
    filename: function (req, file, cb) {
      // get file extension
      const extension = file.mimetype.split("/")[1];

      // generate filename based on folderName
      let fileName = "";
      if (folderName === "users") {
        fileName = `user-${Date.now()}.${extension}`;
      } else if (folderName === "products") {
        fileName = `product-${Date.now()}.${extension}`;
      } else if (folderName === "categories") {
        fileName = file.originalname;
      }
      cb(null, fileName);
    },
  });
  return storage;
};

const fileFilter = (req, file, cb) => {
  // check the type of uploaded file is an image
  const imageType = file.mimetype.split("/")[0];
  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(
      appError.create("this file must be an image", 400, httpStatusText.FAIL),
      false
    );
  }
};

module.exports = { fileFilter, configureMulter };
