const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const ContactUs = require("../models/ContactUs.model");
const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const mongoose = require("mongoose");
const { escapeRegex } = require("../utils/utils");

const getAllContacts = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  const searchQuery = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { message: regex },
      mongoose.Types.ObjectId.isValid(text)
        ? { _id: new mongoose.Types.ObjectId(text) }
        : null,
    ].filter(Boolean);
  }

  const [contacts, totalContactsCount] = await Promise.all([
    ContactUs.find(searchQuery, { __v: 0 })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }),
    ContactUs.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      contacts,
      total: totalContactsCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalContactsCount / limit),
    },
  });
});

const addContact = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: errors.array() });
  }

  const { name, email, phone, message } = req.body;

  const newContact = new ContactUs({
    name,
    email,
    phone,
    message,
  });

  await newContact.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { contact: newContact },
    message: {
      ar: "تم إرسال الرسالة بنجاح",
      en: "Message sent successfully",
    },
  });
});

const getSingleContact = asyncWrapper(async (req, res, next) => {
  const { contactId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(
      appError.create(
        { ar: "المعرف غير صحيح", en: "Invalid id" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const targetContact = await ContactUs.findById(contactId);

  if (!targetContact) {
    const error = appError.create(
      { ar: "الرسالة غير موجودة", en: "Contact not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { contact: targetContact },
  });
});

const deleteContact = asyncWrapper(async (req, res, next) => {
  const { contactId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(
      appError.create(
        { ar: "المعرف غير صحيح", en: "Invalid id" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const targetContact = await ContactUs.findById(contactId);
  if (!targetContact) {
    const error = appError.create(
      { ar: "الرسالة غير موجودة", en: "Contact not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  await ContactUs.deleteOne({ _id: contactId });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم حذف الرسالة بنجاح",
      en: "Contact deleted successfully",
    },
    data: { contact: targetContact },
  });
});

module.exports = {
  getAllContacts,
  addContact,
  getSingleContact,
  deleteContact,
};
