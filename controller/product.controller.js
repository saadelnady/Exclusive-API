const asyncWrapper = require("../middlewares/asyncWrapper");
const Product = require("../models/product.model");
const Admin = require("../models/admin.model");
const FlashSale = require("../models/flashSale.model");

const appError = require("../utils/appError");

const { validationResult } = require("express-validator");
const {
  productStatus,
  httpStatusText,
  roles,
} = require("../utils/constants.js");

const Seller = require("../models/seller.model");
const mongoose = require("mongoose");
const {
  createNotification,
  sendEmail,
  sendPushNotification,
  calculateCartTotal,
  escapeRegex,
} = require("../utils/utils.js");
const Cart = require("../models/cart.model");
const Wishlist = require("../models/wishlist.model");

const getProducts = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const status = req.query.status;
  const sellerId = req.query.sellerId;
  const isOffer = req.query.isOffer;
  const skip = (page - 1) * limit;

  const query = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    query.$or = [
      { "title.ar": regex },
      { "title.en": regex },
      {
        _id: mongoose.Types.ObjectId.isValid(text)
          ? new mongoose.Types.ObjectId(text)
          : undefined,
      },
    ].filter(Boolean);
  }

  if (status) {
    const cleanStatus = Array.isArray(status)
      ? status.map((s) => s.replace(/['"]+/g, ""))
      : status.replace(/['"]+/g, "");

    if (Array.isArray(cleanStatus)) {
      query.status = { $in: cleanStatus };
    } else {
      query.status = cleanStatus;
    }
  }

  if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
    query.sellerId = sellerId;
  }
  if (isOffer !== undefined) {
    const offerValue = isOffer === "true";
    query["options.isOffer"] = offerValue;
  }

  const [products, totalProductsCount] = await Promise.all([
    Product.find(query, { __v: 0 })
      .populate("sellerId")
      .limit(limit)
      .skip(skip),
    Product.countDocuments(query),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      products,
      total: totalProductsCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalProductsCount / limit),
    },
  });
});

// =======================================================================================
const getProduct = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const targetProduct = await Product.findById(productId)
    .populate("categoryId")
    .populate("subCategoryId")
    .populate("brandId")
    .populate("sellerId");
  if (!productId) {
    const error = appError.create(
      "ProductId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!targetProduct) {
    const error = appError.create(
      {
        ar: "المنتج غير موجود",
        en: "Product not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { product: targetProduct } });
});

// =======================================================================================
const addProduct = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const sellerId = req?.body?.sellerId;
  const flashSaleId = req?.body?.flashSaleId;
  const locale = req?.headers?.locale;
  const targetSeller = await Seller.findById(sellerId);

  if (!targetSeller) {
    return next(
      appError.create(
        { ar: "البائع غير موجود", en: "Seller not found" },
        400,
        httpStatusText.ERROR
      )
    );
  }

  const newProduct = new Product({ ...req.body });
  await newProduct.save();

  targetSeller.products.push(newProduct._id);
  if (flashSaleId) {
    for (const option of newProduct.options) {
      if (option.isFlashSale) {
        await addProductToActiveFlashSale(
          flashSaleId,
          newProduct._id,
          option._id
        );
      }
    }
  }

  const rolesToNotify = [roles.ADMIN, roles.SUPER_ADMIN];
  const notificationPromises = [
    ...rolesToNotify.map((role) =>
      createNotification({
        title: { ar: "طلب اضافة منتج جديد", en: "Product addition request" },
        description: {
          ar: `البائع ${targetSeller.name} اضاف منتج جديد: ${newProduct.title.ar}`,
          en: `${targetSeller.name} added a new product: ${newProduct.title.en}`,
        },
        recipientRole: role,
        recipientId: null,
      })
    ),
    createNotification({
      title: { ar: "طلب اضافة منتج جديد", en: "Product addition request" },
      description: {
        ar: `لقد قمت باضافة منتج جديد باسم ${newProduct.title.ar} بانتظار الموافقة`,
        en: `You have added a new product with the name ${newProduct.title.en} waiting for approval`,
      },
      recipientRole: roles.SELLER,
      recipientId: sellerId,
    }),
  ];

  const adminsEmails = (await Admin.find({}, "email")).map(
    (admin) => admin.email
  );

  const emailPromises = [
    sendEmail({
      email: targetSeller.email,
      subject: "Product addition request",
      message: `لقد قمت باضافة منتج جديد باسم ${newProduct.title.ar} بانتظار الموافقة`,
    }),
    ...adminsEmails.map((email) =>
      sendEmail({
        email,
        subject: "Product addition request",
        message: `البائع ${targetSeller.name} اضاف منتج جديد باسم ${newProduct.title.ar} بانتظار الموافقة`,
      })
    ),
  ];

  const admins = await Admin.find(
    { fcmToken: { $exists: true, $ne: null } },
    "fcmToken"
  );
  const adminTokens = admins.map((admin) => admin.fcmToken).filter(Boolean);

  if (targetSeller.fcmToken) {
    adminTokens.push(targetSeller.fcmToken);
  }

  const pushNotificationPromises = adminTokens.map((token) =>
    sendPushNotification(
      token,
      locale === "ar" ? "طلب اضافة منتج جديد" : "New product addition request",
      locale === "ar"
        ? `البائع ${targetSeller.name} أضاف منتج جديد باسم ${newProduct.title.ar} بانتظار الموافقة`
        : `Seller ${targetSeller.name} has added a new product named ${newProduct.title.en} awaiting approval`,
      locale
    )
  );

  await Promise.all([
    ...notificationPromises,
    ...emailPromises,
    ...pushNotificationPromises,
    targetSeller.save(),
  ]);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { product: newProduct },
    message: {
      ar: "تم ارسال طلب باضافة المنتج بنجاح",
      en: "Product addition request sent successfully",
    },
  });
});

// =======================================================================================

const editProduct = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const { personIdWhoIsEditing } = req.body;
  const locale = req?.headers?.locale;
  const targetProduct = await Product.findById(productId);

  if (!targetProduct) {
    const error = appError.create(
      { ar: "المنتج غير موجود", en: "Product not found" }[locale],
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetSeller = await Seller.findById(targetProduct?.sellerId);
  const adminEditing = await Admin.findById(personIdWhoIsEditing);

  let updatedProduct;

  if (adminEditing) {
    updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: { ...req.body } },
      { new: true }
    );

    const statusFromRequest = req.body.status;

    if (statusFromRequest === productStatus.ACCEPTED) {
      const rolesToNotify = [roles.ADMIN, roles.SUPER_ADMIN];

      const notificationPromises = [
        ...rolesToNotify.map((role) =>
          createNotification({
            title:
              locale === "ar"
                ? "موافقة على طلب اضافة منتج"
                : "Product addition approval",
            description:
              locale === "ar"
                ? `تمت الموافقة على طلب اضافة منتج باسم ${updatedProduct.title.ar}`
                : `You have approved a product addition with the name ${updatedProduct.title.en}`,
            recipientRole: role,
            recipientId: null,
          })
        ),
        createNotification({
          title:
            locale === "ar"
              ? "موافقة على طلب اضافة منتج"
              : "Product addition approval",
          description:
            locale === "ar"
              ? `تمت الموافقة على طلب اضافة منتج باسم ${updatedProduct.title.ar}`
              : `You have approved a product addition with the name ${updatedProduct.title.en}`,
          recipientRole: roles.SELLER,
          recipientId: targetProduct.sellerId,
        }),
      ];

      const emailPromises = [
        sendEmail({
          email: targetSeller.email,
          subject:
            locale === "ar"
              ? "موافقة على المنتج"
              : "Product addition approval request",
          message:
            locale === "ar"
              ? `تمت الموافقة على طلب اضافة منتج باسم ${updatedProduct.title.ar}`
              : `You have approved a product addition with the name ${updatedProduct.title.en}`,
        }),
      ];

      const admins = await Admin.find(
        { fcmToken: { $exists: true, $ne: null } },
        "fcmToken"
      );
      const adminTokens = admins.map((admin) => admin.fcmToken).filter(Boolean);

      if (targetSeller.fcmToken) {
        adminTokens.push(targetSeller.fcmToken);
      }

      const pushNotificationPromises = adminTokens.map((token) =>
        sendPushNotification(
          token,
          locale === "ar"
            ? "موافقة على طلب اضافة منتج"
            : "Product addition approval",
          locale === "ar"
            ? `تمت الموافقة على طلب اضافة منتج باسم ${updatedProduct.title.ar}`
            : `You have approved a product addition with the name ${updatedProduct.title.en}`,
          locale
        )
      );

      await Promise.all([
        ...notificationPromises,
        ...emailPromises,
        ...pushNotificationPromises,
        targetSeller.save(),
      ]);
    } else if (statusFromRequest === productStatus.BLOCKED) {
      const notificationPromises = [
        createNotification({
          title: locale === "ar" ? "حجب منتج" : "Product blocked",
          description:
            locale === "ar"
              ? `تم حجب المنتج باسم ${updatedProduct.title.ar} من المتجر`
              : `The product with name ${updatedProduct.title.en} has been blocked`,
          recipientRole: roles.SELLER,
          recipientId: targetSeller._id,
        }),
      ];

      const emailPromises = [
        sendEmail({
          email: targetSeller.email,
          subject: locale === "ar" ? "حجب منتج" : "Product blocked",
          message:
            locale === "ar"
              ? `تم حجب المنتج باسم ${updatedProduct.title.ar} من المتجر`
              : `The product with name ${updatedProduct.title.en} has been blocked`,
        }),
      ];

      const pushNotificationPromises = targetSeller.fcmToken
        ? [
            sendPushNotification(
              targetSeller.fcmToken,
              locale === "ar" ? "حجب منتج" : "Product blocked",
              locale === "ar"
                ? `تم حجب المنتج باسم ${updatedProduct.title.ar} من المتجر`
                : `The product with name ${updatedProduct.title.en} has been blocked`,
              locale
            ),
          ]
        : [];

      await Promise.all([
        ...notificationPromises,
        ...emailPromises,
        ...pushNotificationPromises,
        targetSeller.save(),
      ]);
    }
  } else {
    updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: { ...req.body, status: productStatus.PENDING },
      },
      { new: true }
    );

    const rolesToNotify = [roles.ADMIN, roles.SUPER_ADMIN];

    const notificationPromises = [
      ...rolesToNotify.map((role) =>
        createNotification({
          title: locale === "ar" ? "طلب تعديل منتج" : "Product edit request",
          description:
            locale === "ar"
              ? `تم تقديم طلب تعديل على المنتج: ${updatedProduct.title.ar}`
              : `An edit request has been submitted for the product: ${updatedProduct.title.en}`,
          recipientRole: role,
          recipientId: null,
        })
      ),
      createNotification({
        title: locale === "ar" ? "طلب تعديل منتج" : "Product edit request",
        description:
          locale === "ar"
            ? `لقد قمت بتعديل المنتج باسم ${updatedProduct.title.ar} وبانتظار المراجعة`
            : `You have edited the product named ${updatedProduct.title.en} and it is awaiting review`,
        recipientRole: roles.SELLER,
        recipientId: targetSeller._id,
      }),
    ];

    const adminsEmails = (await Admin.find({}, "email")).map(
      (admin) => admin.email
    );
    const emailPromises = [
      sendEmail({
        email: targetSeller.email,
        subject: locale === "ar" ? "طلب تعديل منتج" : "Product edit request",
        message:
          locale === "ar"
            ? `لقد قمت بتعديل المنتج باسم ${updatedProduct.title.ar} وبانتظار المراجعة`
            : `You have edited the product named ${updatedProduct.title.en} and it is awaiting review`,
      }),
      ...adminsEmails.map((email) =>
        sendEmail({
          email,
          subject: locale === "ar" ? "طلب تعديل منتج" : "Product edit request",
          message:
            locale === "ar"
              ? `تم تقديم طلب تعديل على المنتج: ${updatedProduct.title.ar}`
              : `An edit request has been submitted for the product: ${updatedProduct.title.en}`,
        })
      ),
    ];

    const admins = await Admin.find(
      { fcmToken: { $exists: true, $ne: null } },
      "fcmToken"
    );
    const adminTokens = admins.map((admin) => admin.fcmToken).filter(Boolean);
    if (targetSeller.fcmToken) {
      adminTokens.push(targetSeller.fcmToken);
    }

    const pushNotificationPromises = adminTokens.map((token) =>
      sendPushNotification(
        token,
        locale === "ar" ? "طلب تعديل منتج" : "Product edit request",
        locale === "ar"
          ? `تم تقديم طلب تعديل على المنتج: ${updatedProduct.title.ar}`
          : `An edit request has been submitted for the product: ${updatedProduct.title.en}`,
        locale
      )
    );

    await Promise.all([
      ...notificationPromises,
      ...emailPromises,
      ...pushNotificationPromises,
    ]);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { product: updatedProduct },
    message:
      locale === "ar"
        ? "تم تعديل المنتج بنجاح"
        : "Product updated successfully",
  });
});

// =======================================================================================
const deleteProduct = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const targetProduct = await Product.findById(productId);
  const sellerId = targetProduct?.sellerId;

  if (!targetProduct) {
    const error = appError.create(
      {
        ar: "المنتج غير موجود",
        en: "Product not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetSeller = await Seller.findById(sellerId);

  if (!targetSeller) {
    const error = appError.create(
      {
        ar: "البائع غير موجود",
        en: "Seller not found",
      },
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  targetSeller.products.pull(productId);
  await targetSeller.save();
  await Wishlist.updateMany(
    { "products.product": productId },
    { $pull: { products: { product: productId } } }
  );

  const affectedCarts = await Cart.find({ "products.product": productId });

  for (const cart of affectedCarts) {
    cart.products = cart.products.filter(
      (p) => p.product.toString() !== productId
    );
    calculateCartTotal(cart);
    await cart.save();
  }

  await Product.deleteOne({ _id: productId });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { product: targetProduct },
    message: {
      ar: "تم حذف المنتج بنجاح",
      en: "Product deleted successfully",
    },
  });
});
// =======================================================================================
const addProductToActiveFlashSale = async (
  flashSaleId,
  productId,
  optionId
) => {
  if (!mongoose.Types.ObjectId.isValid(flashSaleId)) {
    return next(
      appError.create("Invalid flash sale ID", 400, httpStatusText.FAIL)
    );
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(
      appError.create("Invalid product ID", 400, httpStatusText.FAIL)
    );
  }
  if (optionId && !mongoose.Types.ObjectId.isValid(optionId)) {
    return next(appError.create("Invalid option ID", 400, httpStatusText.FAIL));
  }

  const flashSale = await FlashSale.findById(flashSaleId);

  if (!flashSale) {
    return next(
      appError.create(
        { ar: "العرض غير موجود", en: "Flash sale not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  const existingProduct = flashSale.products.find(
    (p) =>
      p.productId.toString() === productId &&
      ((optionId && p.optionId?.toString() === optionId) || !optionId)
  );

  if (existingProduct) {
    return next(
      appError.create(
        {
          ar: "المنتج موجود بالفعل في الفلاش سيل",
          en: "Product already in flash sale",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  flashSale.products.push({ productId, optionId: optionId || null });
  await flashSale.save();

  const populatedFlashSale = await flashSale
    .populate("products.productId")
    .populate("products.optionId");

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { flashSale: populatedFlashSale },
    message: {
      ar: "تم إضافة المنتج إلى الفلاش سيل بنجاح",
      en: "Product added to flash sale successfully",
    },
  });
};
module.exports = {
  getProducts,
  getProduct,
  addProduct,
  editProduct,
  deleteProduct,
};
