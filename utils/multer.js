const multer = require("multer");
const configureMulter = (folderName) => {
  const storage = multer.diskStorage({
    // choose file direction based on folderName
    destination: function (req, file, cb) {
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
      }
      cb(null, fileName);
    },
  });
  return storage
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
