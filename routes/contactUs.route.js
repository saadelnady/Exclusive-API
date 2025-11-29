const express = require("express");
const {
  getAllContacts,
  addContact,
  deleteContact,
  getSingleContact,
} = require("../controller/contactUs.controller.js");

const verifyToken = require("../middlewares/verifyToken");
const { roles } = require("../utils/constants");
const alloewdTo = require("../middlewares/alloewdTo");
const { contactValidation } = require("../middlewares/contactUsValidation.js");

const router = express.Router();

// All Contacts
router
  .route("/")
  .get(verifyToken, alloewdTo(roles.SUPER_ADMIN, roles.ADMIN), getAllContacts)
  .post(contactValidation(), addContact);

router
  .route("/:contactId")
  .get(verifyToken, alloewdTo(roles.SUPER_ADMIN, roles.ADMIN), getSingleContact)
  .delete(verifyToken, alloewdTo(roles.SUPER_ADMIN), deleteContact);

module.exports = router;
