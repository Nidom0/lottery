const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Winner = require("../models/Winner");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

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
  let docs = [];
  if (req.customer.documents) {
    try {
      docs = JSON.parse(req.customer.documents);
    } catch (err) {
      console.error("cannot parse docs", err);
    }
  }

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
  upload.array("documents", 5),
  async (req, res) => {
    const { fullName, phone, description } = req.body;

    let docs = [];
    if (req.customer.documents) {
      try {
        docs = JSON.parse(req.customer.documents);
      } catch {}
    }

    const newDocs = (req.files || []).map(file => ({
      file: `/public/uploads/${file.filename}`,
      name: file.originalname,
      date: new Date(),
    }));

    const merged = [...docs, ...newDocs];

    req.customer.fullName = fullName || req.customer.fullName;
    req.customer.phone = phone || req.customer.phone;
    req.customer.description = description || req.customer.description;
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
