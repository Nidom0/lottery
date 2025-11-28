const express = require("express");
const router = express.Router();
const Winner = require("../models/Winner");
const Template = require("../models/Template");
const QRCode = require("qrcode");

// Middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) return next();
  return res.redirect("/admin/login");
};

const generateRegistrationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// -------------------------------------------------------
// DASHBOARD LOTTERY PAGE
// -------------------------------------------------------
router.get("/lottery", requireAuth, async (req, res) => {
  try {
    const winners = await Winner.findAll({ order: [["id", "DESC"]] });

    const safe = (v, f = false) =>
      typeof v === "undefined" || v === null ? f : v;

    const totalCustomers = winners.length;
    const totalViewed = winners.filter(w => safe(w.viewed)).length;
    const totalWinners = winners.filter(w => safe(w.prize, "").trim() !== "")
      .length;

    res.render("dashboard-lottery", {
      winners,
      totalCustomers,
      totalViewed,
      totalWinners,
    });
  } catch (err) {
    console.log("❌ dashboard error:", err);
    res.status(500).send("خطای سرور — داشبورد قابل بارگذاری نیست");
  }
});

// -------------------------------------------------------
// صفحه ساخت تمپلیت داخل داشبورد
// -------------------------------------------------------
router.get("/lottery/template", requireAuth, async (req, res) => {
  const templates = await Template.findAll({ order: [["id", "DESC"]] });
  res.render("template", { templates });
});

// -------------------------------------------------------
// CREATE WINNER PAGE
// -------------------------------------------------------
router.get("/lottery/create-winner", requireAuth, async (req, res) => {
  const templates = await Template.findAll({
    order: [["id", "DESC"]],
  });

  res.render("create-winner", { templates });
});

// -------------------------------------------------------
// REGISTRATION CODES PAGE
// -------------------------------------------------------
router.get("/lottery/registration-codes", requireAuth, async (req, res) => {
  const winners = await Winner.findAll({ order: [["id", "DESC"]] });
  res.render("registration-codes", { winners, message: req.query.message || null });
});

router.post("/lottery/registration-codes", requireAuth, async (req, res) => {
  const { winnerId } = req.body;
  const winner = await Winner.findByPk(winnerId);
  if (!winner) return res.redirect("/dashboard/lottery/registration-codes?message=برنده پیدا نشد");

  winner.registrationCode = generateRegistrationCode();
  winner.registrationUsed = false;
  winner.accountPassword = null;
  await winner.save();

  return res.redirect(
    `/dashboard/lottery/registration-codes?message=کد برای ${encodeURIComponent(
      winner.fullName
    )} ساخته شد`
  );
});

// -------------------------------------------------------
// CREATE WINNER
// -------------------------------------------------------
router.post("/lottery/create-winner", requireAuth, async (req, res) => {
  try {
    const { fullName, phone, prize, templateId, winDate } = req.body;

    const randomLink = Math.floor(10000000 + Math.random() * 90000000).toString();

    const registrationCode = generateRegistrationCode();

    await Winner.create({
      fullName,
      phone,
      prize,
      templateId,
      winDate,
      linkId: randomLink,
      registrationCode,
      registrationUsed: false,
      infoComplete: false,
      viewed: false,
    });

    res.redirect(`/winner/${randomLink}`);

  } catch (err) {
    console.log("❌ create error:", err);
    res.send("خطا در ثبت برنده");
  }
});

// -------------------------------------------------------
// WINNER PROFILE PAGE
// -------------------------------------------------------
router.get("/lottery/profile/:id", requireAuth, async (req, res) => {
  const customer = await Winner.findByPk(req.params.id);
  if (!customer) return res.send("NOT FOUND");

  let docs = [];
  if (customer.documents) {
    try {
      docs = JSON.parse(customer.documents);
    } catch {}
  }

  res.render("winner-profile", { customer, docs });
});

// -------------------------------------------------------
// DASHBOARD LOAN PAGE
// -------------------------------------------------------
router.get("/loan", requireAuth, (_req, res) => {
  const persianDate = new Date().toLocaleDateString("fa-IR-u-ca-persian");

  const pipeline = [
    { label: "پرونده جدید", count: 3 },
    { label: "در حال بررسی", count: 5 },
    { label: "تایید شده", count: 2 },
    { label: "در انتظار پرداخت", count: 1 },
  ];

  const sampleApplicants = [
    {
      name: "شمیم ایرانیان",
      nationalId: "0079417061",
      phone: "09120000000",
      bank: "بلو بانک",
      card: "6037-9900-1122-3344",
      amount: "400,000,000",
      status: "در حال بررسی",
      created: persianDate,
    },
    {
      name: "زهرا محمدی",
      nationalId: "1284578965",
      phone: "09351231234",
      bank: "ملت",
      card: "6104-3377-5522-1100",
      amount: "750,000,000",
      status: "پرونده جدید",
      created: persianDate,
    },
  ];

  res.render("dashboard-loan", { persianDate, pipeline, sampleApplicants });
});

// -------------------------------------------------------
// DELETE WINNER
// -------------------------------------------------------
router.post("/lottery/delete/:id", requireAuth, async (req, res) => {
  await Winner.destroy({ where: { id: req.params.id } });
  res.redirect("/dashboard/lottery");
});

module.exports = router;
