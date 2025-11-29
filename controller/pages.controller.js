const asyncWrapper = require("../middlewares/asyncWrapper");
const Page = require("../models/page.model.js");
const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const { generateSlug } = require("../utils/utils");

const getAllPages = asyncWrapper(async (req, res, next) => {
  const pages = await Page.find();

  if (!pages) {
    const error = appError.create(
      {
        ar: "لا يوجد صفحات لعرضها",
        en: "There is no pages to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      pages,
    },
  });
});

const addPage = asyncWrapper(async (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    const error = appError.create(
      {
        ar: "يجب إدخال عنوان الصفحة.",
        en: "Page title is required.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const pageSlug = generateSlug(title);

  const existing = await Page.findOne({ slug: pageSlug });
  if (existing) {
    const error = appError.create(
      {
        ar: "العنوان موجود بالفعل اختر عنوان جديد",
        en: "Title already exists, choose a different title",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newPage = new Page({
    title,
    slug: pageSlug,
    sections: [],
  });

  await newPage.save();

  return res.status(201).json({
    status: "success",
    page: newPage,
  });
});

const getPage = asyncWrapper(async (req, res, next) => {
  const { pageSlug } = req.params;

  if (!pageSlug) {
    const error = appError.create(
      {
        ar: "المعرف مطلوب",
        en: "Slug is required",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetPage = await Page.findOne({ slug: pageSlug });
  if (!targetPage) {
    const error = appError.create(
      {
        ar: "لا يوجد صفحة بهذا المعرف",
        en: "There is no page with this pageSlug",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  return res.status(200).json({
    status: "success",
    page: targetPage,
  });
});

const editPage = asyncWrapper(async (req, res, next) => {
  const oldSlug = req.params.pageSlug;
  const { title } = req.body;

  if (!title) {
    const error = appError.create(
      {
        ar: "يجب إدخال عنوان الصفحة.",
        en: "Page title is required.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newSlug = generateSlug(title);

  const page = await Page.findOne({ pageSlug: oldSlug });
  if (!page) {
    const error = appError.create(
      {
        ar: "الصفحة غير موجودة.",
        en: "Page not found.",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const existing = await Page.findOne({
    pageSlug: newSlug,
    _id: { $ne: page._id },
  });
  if (existing) {
    const error = appError.create(
      {
        ar: "عنوان الصفحة مستخدم بالفعل.",
        en: "Page title already exists.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  page.title = title;
  page.pageSlug = newSlug;

  await page.save();

  return res.status(200).json({
    status: "success",
    page,
  });
});

const deletePage = asyncWrapper(async (req, res, next) => {
  const { pageSlug } = req.params;

  const deletedPage = await Page.findOneAndDelete({ slug: pageSlug });

  if (!deletedPage) {
    const error = appError.create(
      {
        ar: "لا يوجد صفحة بهذا المعرف",
        en: "There is no page with this pageSlug",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: "success",
    message: {
      ar: "تم حذف الصفحة بنجاح",
      en: "Page deleted successfully",
    },
    page: deletedPage,
  });
});

const addPageSection = asyncWrapper(async (req, res, next) => {
  const { pageSlug } = req.params;
  const newSection = req.body.section;

  if (!newSection?.title?.en) {
    const error = appError.create(
      {
        ar: "يرجى إدخال عنوان القسم.",
        en: "Enter section title.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  newSection.slug = generateSlug(newSection.title.en);
  const exictSection = await Page.findOne({ "sections.slug": newSection.slug });
  if (exictSection) {
    const error = appError.create(
      {
        ar: "عنوان القسم مستخدم بالفعل.",
        en: "Section title already exists.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const updatedPage = await Page.findOneAndUpdate(
    { slug: pageSlug },
    { $push: { sections: newSection } },
    { new: true }
  );

  if (!updatedPage) {
    const error = appError.create(
      {
        ar: "الصفحة غير موجودة.",
        en: "Page not found.",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تمت إضافة القسم بنجاح.",
      en: "Section added successfully.",
    },
    page: updatedPage,
  });
});

const deletePageSection = asyncWrapper(async (req, res, next) => {
  const { pageSlug, sectionSlug } = req.params;

  const updatedPage = await Page.findOneAndUpdate(
    { slug: pageSlug },
    { $pull: { sections: { slug: sectionSlug } } },
    { new: true }
  );

  if (!updatedPage) {
    const error = appError.create(
      {
        ar: "الصفحة غير موجودة.",
        en: "Page not found.",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم حذف القسم بنجاح.",
      en: "Section deleted successfully.",
    },
    page: updatedPage,
  });
});

const editPageSection = asyncWrapper(async (req, res, next) => {
  const { pageSlug, sectionSlug } = req.params;
  const updatedSectionData = req.body.section;

  const page = await Page.findOne({
    slug: pageSlug,
    "sections.slug": { $ne: sectionSlug },
  });

  if (page) {
    const error = appError.create(
      {
        ar: "عنوان القسم مستخدم بالفعل.",
        en: "Section title already exists.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const setData = {};
  for (const key in updatedSectionData) {
    setData[`sections.$.${key}`] = updatedSectionData[key];
  }

  const updatedPage = await Page.findOneAndUpdate(
    { slug: pageSlug, "sections.slug": sectionSlug },
    { $set: setData },
    { new: true }
  );

  if (!updatedPage) {
    const error = appError.create(
      {
        ar: "القسم أو الصفحة غير موجودة.",
        en: "Page or section not found.",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const targetSection = updatedPage.sections.find(
    (section) => section.slug === sectionSlug
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم تعديل القسم بنجاح.",
      en: "Section updated successfully.",
    },
    data: { section: targetSection },
  });
});

const getPageSections = asyncWrapper(async (req, res, next) => {
  const { pageSlug } = req.params;

  const page = await Page.findOne({
    slug: pageSlug,
  });

  if (!page) {
    const error = appError.create(
      {
        ar: "الصفحة غير موجودة.",
        en: "Page not found.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    sections: page?.sections,
  });
});
const getPageSection = asyncWrapper(async (req, res, next) => {
  const { pageSlug, sectionSlug } = req.params;

  const page = await Page.findOne({
    slug: pageSlug,
    "sections.slug": sectionSlug,
  });

  if (!page) {
    const error = appError.create(
      {
        ar: "الصفحة غير موجودة.",
        en: "Page not found.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const targetSection = page.sections.find(
    (section) => section.slug === sectionSlug
  );
  if (!targetSection) {
    const error = appError.create(
      {
        ar: "القسم غير موجود.",
        en: "Section not found.",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { section: targetSection },
  });
});

module.exports = {
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
};
