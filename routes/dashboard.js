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
    const { fullName, phone, prize, templateId } = req.body;

    const randomLink = Math.floor(10000000 + Math.random() * 90000000).toString();

    const registrationCode = generateRegistrationCode();

    await Winner.create({
      fullName,
      phone,
      prize,
      templateId,
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
// DELETE WINNER
// -------------------------------------------------------
router.post("/lottery/delete/:id", requireAuth, async (req, res) => {
  await Winner.destroy({ where: { id: req.params.id } });
  res.redirect("/dashboard/lottery");
});

module.exports = router;
