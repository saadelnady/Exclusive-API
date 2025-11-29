const asyncWrapper = require("../middlewares/asyncWrapper");
const Settings = require("../models/settings.model.js");
const { httpStatusText } = require("../utils/constants");
const appError = require("../utils/appError");

const getAllSettings = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.find();

  if (!settings) {
    const error = appError.create(
      {
        ar: "لا يوجد اعدادات لعرضها",
        en: "There is no settings to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      settings,
    },
  });
});
const addSettings = asyncWrapper(async (req, res, next) => {
  const existing = await Settings.findOne();
  if (existing) {
    const error = appError.create(
      {
        ar: "الإعدادات موجودة بالفعل",
        en: "Settings already exist",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const settings = await Settings.create(req.body);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      settings,
    },
  });
});

const editSettings = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { ...req.body },
    { new: true }
  );
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { settings },
    message: {
      ar: "تم  تعديل اعدادات الموقع بنجاح",
      en: "Website settings updated successfully",
    },
  });
});

const addSocialMedia = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.findOne();

  if (!settings) {
    return next(
      appError.create(
        {
          ar: "لا يوجد إعدادات لعرضها",
          en: "There is no settings to show",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  if (!settings.socials) {
    settings.socials = [];
  }

  const existSocialMedia = settings.socials.find(
    (media) =>
      media.title?.ar === req.body?.title?.ar ||
      media.title?.en === req.body?.title?.en
  );

  if (existSocialMedia) {
    return next(
      appError.create(
        {
          ar: "وسيلة التواصل الاجتماعي موجودة بالفعل",
          en: "Social media already exists",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  settings.socials.push(req.body);
  await settings.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم إضافة وسيلة التواصل الاجتماعي بنجاح",
      en: "Social media added successfully",
    },
    data: { socials: settings.socials },
  });
});

const editSocialMedia = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.findOne();

  if (!settings) {
    return next(
      appError.create(
        {
          ar: "لا يوجد إعدادات لعرضها",
          en: "There is no settings to show",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const socialId = req.params.socialId;

  if (!socialId) {
    return next(
      appError.create(
        {
          ar: "المعرف مطلوب",
          en: "Slug is required",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const existSocialMedia = settings.socials.find(
    (media) => media._id == socialId
  );

  if (!existSocialMedia) {
    return next(
      appError.create(
        {
          ar: "وسيلة التواصل الاجتماعي غير موجودة",
          en: "Social media does not exist",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const existingName = settings.socials.find(
    (media) =>
      media._id != socialId &&
      (media.title?.ar === req.body?.title?.ar ||
        media.title?.en === req.body?.title?.en)
  );

  if (existingName) {
    return next(
      appError.create(
        {
          ar: "وسيلة التواصل الاجتماعي موجودة بالفعل",
          en: "Social media already exists",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }
  Object.assign(existSocialMedia, {
    image: req.body.image ?? existSocialMedia.image,
    link: req.body.link ?? existSocialMedia.link,
    title: {
      ar: req.body.title?.ar ?? existSocialMedia.title.ar,
      en: req.body.title?.en ?? existSocialMedia.title.en,
    },
  });

  await settings.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم تعديل وسيلة التواصل الاجتماعي بنجاح",
      en: "Social media  updated successfully",
    },
    data: { socials: settings.socials },
  });
});

const getSingleSocialMedia = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.findOne();
  if (!settings) {
    const error = appError.create(
      {
        ar: "لا يوجد اعدادات لعرضها",
        en: "There is no settings to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (!settings.socials) {
    const error = appError.create(
      {
        ar: "لا يوجد وسائل التواصل الاجتماعية لعرضها",
        en: "There is no social media to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetSocial = settings.socials.find(
    (social) => req.params.socialId == social._id
  );

  if (!targetSocial) {
    const error = appError.create(
      {
        ar: "لا يوجد وسيلة التواصل الاجتماعي بهذا الاسم",
        en: "There is no social media with this title",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      socialMedia: targetSocial,
    },
  });
});

const getAllSocialMedia = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.findOne();
  if (!settings) {
    const error = appError.create(
      {
        ar: "لا يوجد اعدادات لعرضها",
        en: "There is no settings to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const socialMedia = settings.socials;
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      socials: socialMedia,
    },
  });
});

const deleteSocialMedia = asyncWrapper(async (req, res, next) => {
  const settings = await Settings.findOne();
  if (!settings) {
    const error = appError.create(
      {
        ar: "لا يوجد اعدادات لعرضها",
        en: "There is no settings to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (!settings.socials) {
    const error = appError.create(
      {
        ar: "لا يوجد وسائل التواصل الاجتماعية لعرضها",
        en: "There is no social media to show",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetSocial = settings.socials.find(
    (social) => req.params.socialId == social._id
  );

  if (!targetSocial) {
    const error = appError.create(
      {
        ar: "لا يوجد وسيلة التواصل الاجتماعي بهذا الاسم",
        en: "There is no social media with this title",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  settings.socials = settings.socials.filter(
    (social) => social._id != targetSocial._id
  );
  await settings.save();
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم حذف وسيلة التواصل الاجتماعي بنجاح",
      en: "Social media deleted successfully",
    },
    data: { socials: settings.socials },
  });
});

module.exports = {
  addSettings,
  getAllSettings,
  editSettings,
  addSocialMedia,
  getAllSocialMedia,
  getSingleSocialMedia,
  editSocialMedia,
  deleteSocialMedia,
};
