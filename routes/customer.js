const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Winner = require("../models/Winner");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("فقط فایل تصویری مجاز است."));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: "documents", maxCount: 5 },
  { name: "avatar", maxCount: 1 },
]);

const sanitizeDigits = value => (value || "").replace(/[^0-9]/g, "");
const parseDocs = docsStr => {
  try {
    return JSON.parse(docsStr || "[]");
  } catch (err) {
    console.error("cannot parse docs", err);
    return [];
  }
};

const requireCustomer = async (req, res, next) => {
  if (!req.session.customerId) return res.redirect("/customer/create-account");
  const customer = await Winner.findByPk(req.session.customerId);
  if (!customer) return res.redirect("/customer/create-account");
  req.customer = customer;
  next();
};

router.get("/create-account", (req, res) => {
  res.render("Createaccount-customers", { error: null, success: null });
});

router.get("/login", (req, res) => {
  res.render("customer-login", { error: null });
});

router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  const customer = await Winner.findOne({
    where: { phone, accountPassword: password },
  });

  if (!customer || !customer.registrationUsed) {
    return res.render("customer-login", {
      error: "حسابی با این مشخصات یافت نشد یا هنوز فعال نشده است.",
    });
  }

  req.session.customerId = customer.id;
  return res.redirect("/customer/upload-info");
});

router.post("/create-account", async (req, res) => {
  const { phone, password, code } = req.body;

  const customer = await Winner.findOne({
    where: { phone, registrationCode: code },
  });

  if (!customer) {
    return res.render("Createaccount-customers", {
      error: "کد ثبت‌نام یا شماره تماس صحیح نیست.",
      success: null,
    });
  }

  if (customer.registrationUsed && customer.accountPassword !== password) {
    return res.render("Createaccount-customers", {
      error: "اکانت قبلاً ساخته شده است. لطفاً رمز درست را وارد کنید.",
      success: null,
    });
  }

  customer.accountPassword = password;
  customer.registrationUsed = true;
  await customer.save();

  req.session.customerId = customer.id;
  return res.redirect("/customer/upload-info");
});

router.get("/upload-info", requireCustomer, async (req, res) => {
  const docs = parseDocs(req.customer.documents);

  res.render("customer-upload", {
    customer: req.customer,
    docs,
    error: null,
    success: null,
  });
});

router.post(
  "/upload-info",
  requireCustomer,
  (req, res, next) => {
    uploadFields(req, res, err => {
      if (err) {
        return res.render("customer-upload", {
          customer: req.customer,
          docs: parseDocs(req.customer.documents),
          error: err.message,
          success: null,
        });
      }
      next();
    });
  },
  async (req, res) => {
    const { fullName, phone, description, cardNumber, shaba, nationalId, birthDate } = req.body;

    const docs = parseDocs(req.customer.documents);

    const docFiles = Array.isArray(req.files?.documents) ? req.files.documents : [];
    const newDocs = docFiles.map(file => ({
      file: `/public/uploads/${file.filename}`,
      name: file.originalname,
      date: new Date(),
    }));

    const avatarFile = Array.isArray(req.files?.avatar) ? req.files.avatar[0] : null;
    if (avatarFile) {
      req.customer.avatar = `/public/uploads/${avatarFile.filename}`;
      newDocs.unshift({
        file: req.customer.avatar,
        name: "کارت ملی",
        date: new Date(),
      });
    }

    const merged = [...docs, ...newDocs];

    req.customer.fullName = fullName || req.customer.fullName;
    req.customer.phone = phone || req.customer.phone;
    req.customer.description = description || req.customer.description;
    req.customer.cardNumber = sanitizeDigits(cardNumber) || req.customer.cardNumber;
    req.customer.shaba = sanitizeDigits(shaba) || req.customer.shaba;
    req.customer.nationalId = sanitizeDigits(nationalId) || req.customer.nationalId;
    req.customer.birthDate = birthDate || req.customer.birthDate;
    req.customer.documents = JSON.stringify(merged);
    req.customer.infoComplete = true;

    await req.customer.save();

    res.render("customer-upload", {
      customer: req.customer,
      docs: merged,
      error: null,
      success: "اطلاعات شما با موفقیت ثبت و ارسال شد.",
    });
  }
);

module.exports = router;
