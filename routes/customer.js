const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Winner = require("../models/Winner");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

const requireCustomer = (req, res, next) => {
  if (req.session && req.session.customerId) return next();
  return res.redirect("/customer/create-account");
};

router.get("/create-account", (req, res) => {
  res.render("Createaccount-customers", { error: null, success: null });
});

router.post("/create-account", async (req, res) => {
  const { phone, password, code } = req.body;

  const winner = await Winner.findOne({ where: { phone, registrationCode: code } });

  if (!winner) {
    return res.render("Createaccount-customers", {
      error: "کد یا شماره تماس اشتباه است.",
      success: null,
    });
  }

  if (winner.password && winner.password !== password) {
    return res.render("Createaccount-customers", {
      error: "رمز عبور قبلی اشتباه است.",
      success: null,
    });
  }

  if (!winner.password) {
    await winner.update({ password });
  }

  req.session.customerId = winner.id;
  req.session.customerName = winner.fullName;

  return res.redirect("/customer/upload");
});

router.get("/upload", requireCustomer, async (req, res) => {
  const customer = await Winner.findByPk(req.session.customerId);
  if (!customer) return res.redirect("/customer/create-account");
  let docs = [];

  if (customer.documents) {
    try {
      docs = JSON.parse(customer.documents);
    } catch {}
  }

  res.render("customer-upload", {
    customer,
    docs,
    success: req.query.success,
  });
});

router.post(
  "/upload",
  requireCustomer,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  async (req, res) => {
    const customer = await Winner.findByPk(req.session.customerId);
    if (!customer) return res.redirect("/customer/create-account");

    let docs = [];
    if (customer.documents) {
      try {
        docs = JSON.parse(customer.documents);
      } catch {}
    }

    if (req.files.avatar && req.files.avatar.length > 0) {
      customer.avatar = `/public/uploads/${req.files.avatar[0].filename}`;
    }

    if (req.files.documents) {
      req.files.documents.forEach((file) => {
        docs.push({ file: `/public/uploads/${file.filename}`, date: new Date() });
      });
    }

    await customer.update({
      avatar: customer.avatar,
      documents: JSON.stringify(docs),
      infoComplete: true,
    });

    return res.redirect("/customer/upload?success=1");
  }
);

router.get("/logout", (req, res) => {
  req.session.customerId = null;
  req.session.customerName = null;
  res.redirect("/customer/create-account");
});

module.exports = router;
