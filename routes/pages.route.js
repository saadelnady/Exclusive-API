const express = require("express");
const {
  getAllPages,
  addPage,
  getPage,
  editPage,
  deletePage,

  addPageSection,
  deletePageSection,
  editPageSection,
  getPageSections,
  getPageSection,
} = require("../controller/pages.controller.js");

const verifyToken = require("../middlewares/verifyToken");
const { roles } = require("../utils/constants");
const alloewdTo = require("../middlewares/alloewdTo");

const router = express.Router();

// pages
router
  .route("/")
  .get(getAllPages)
  .post(verifyToken, alloewdTo(roles.SUPER_ADMIN), addPage);
router
  .route("/:pageSlug")
  .get(getPage)
  .put(verifyToken, alloewdTo(roles.SUPER_ADMIN), editPage)
  .delete(verifyToken, alloewdTo(roles.SUPER_ADMIN), deletePage);

// page sections
router
  .route("/:pageSlug/sections")
  .get(getPageSections)
  .post(verifyToken, alloewdTo(roles.SUPER_ADMIN), addPageSection);

router
  .route("/:pageSlug/sections/:sectionSlug")
  .get(getPageSection)
  .put(verifyToken, alloewdTo(roles.SUPER_ADMIN), editPageSection)
  .delete(verifyToken, alloewdTo(roles.SUPER_ADMIN), deletePageSection);

module.exports = router;
