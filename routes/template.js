const express = require("express");
const router = express.Router();
const Template = require("../models/Template");

// صفحه مدیریت تمپلیت‌ها
router.get("/", async (req, res) => {
  const templates = await Template.findAll({ order: [["id", "DESC"]] });
  res.render("template", { templates });
});

// ساخت تمپلیت جدید
router.post("/create", async (req, res) => {
  const { title, companyName, content } = req.body;

  await Template.create({
    title,
    companyName,
    content,
    dateText: new Date().toLocaleDateString("fa-IR")
  });

  return res.redirect("/template");
});

// حذف تمپلیت
router.post("/delete/:id", async (req, res) => {
  await Template.destroy({ where: { id: req.params.id } });
  return res.redirect("/template");
});

module.exports = router;
