const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const asyncWrapper = require("../middlewares/asyncWrapper");
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".png",
  ".gif",
  ".mp4",
  ".avi",
  ".mov",
  ".pdf",
  ".docx",
  ".zip",
  ".rar",
  ".txt",
  ".doc",
  ".csv",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".odt",
  ".ods",
  ".odp",
  "heic",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post(
  "/",
  upload.array("files", 10),
  asyncWrapper(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: { ar: "لم يتم رفع اي ملفات", en: "No files uploaded" },
      });
    }
    const BASE_URL =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      path: file.path,
      size: file.size,
      url: `${BASE_URL}/uploads/${file.filename}`,
    }));

    res.status(200).json({
      message: {
        ar: "تم رفع الملفات بنجاح",
        en: "Files uploaded successfully",
      },
      files: uploadedFiles,
    });
  })
);

module.exports = router;
