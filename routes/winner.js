// routes/winner.js
const express = require("express");
const router = express.Router();
const Winner = require("../models/Winner");
const Template = require("../models/Template");

router.get("/:linkId", async (req, res) => {
  try {

    const customer = await Winner.findOne({
      where: { linkId: req.params.linkId }
    });

    if (!customer) return res.send("NOT FOUND");

    const template = await Template.findByPk(customer.templateId);
    if (!template) return res.send("TEMPLATE NOT FOUND");

    // تاریخ دلخواه یا امروز
    const today = new Date().toLocaleDateString("fa-IR");
    const displayDate = customer.winDate || today;

    // متن تمپلیت اصلی
    let text = template.content || "";

    if (!text.trim()) {
      text = `${customer.fullName} عزیز، تبریک! شما برنده ${customer.prize || "جوایز"} از طرف ${template.companyName} شده‌اید.`;
    }

    // جایگذاری مقادیر
    text = text
      .replace(/\[نام مشتری\]/g, customer.fullName)
      .replace(/\[مبلغ\]/g, customer.prize)
      .replace(/\[نام شرکت\]/g, template.companyName)
      .replace(/\[تاریخ\]/g, displayDate);

    // ارسال به صفحه EJS
    res.render("winner-page", {
      text,                    // ← ← ← این مهم‌ترین خط است
      fullName: customer.fullName,
      prize: customer.prize,
      date: displayDate,
      companyName: template.companyName
    });

  } catch (err) {
    console.log("❌ ERROR WINNER:", err);
    res.send("خطا در بارگذاری صفحه");
  }
});

module.exports = router;
