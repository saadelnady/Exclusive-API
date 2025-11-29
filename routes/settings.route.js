const express = require("express");
const {
  getAllSettings,
  editSettings,
  addSettings,
  addSocialMedia,
  getAllSocialMedia,
  getSingleSocialMedia,
  editSocialMedia,
  deleteSocialMedia,
} = require("../controller/settings.controller.js");

const verifyToken = require("../middlewares/verifyToken");
const { roles } = require("../utils/constants");
const alloewdTo = require("../middlewares/alloewdTo");

const router = express.Router();
// settings
router
  .route("/")
  .get(getAllSettings)
  .post(verifyToken, alloewdTo(roles.SUPER_ADMIN), addSettings)
  .put(verifyToken, alloewdTo(roles.SUPER_ADMIN), editSettings);

// socials
router
  .route("/socials")
  .get(getAllSocialMedia)
  .post(verifyToken, alloewdTo(roles.SUPER_ADMIN), addSocialMedia);

router
  .route("/socials/:socialId")
  .get(getSingleSocialMedia)
  .put(verifyToken, alloewdTo(roles.SUPER_ADMIN), editSocialMedia)
  .delete(verifyToken, alloewdTo(roles.SUPER_ADMIN), deleteSocialMedia);
module.exports = router;
