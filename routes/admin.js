const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

router.get("/login", (req, res) => {
  if (req.session.isAuthenticated) return res.redirect("/dashboard/lottery");
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { username, password, panel } = req.body;

  const admin = await Admin.findOne({ where: { username, password } });

  if (!admin)
    return res.render("login", { error: "نام کاربری یا رمز اشتباه است" });

  req.session.isAuthenticated = true;
  req.session.user = admin.username;

  if (panel === "loan") return res.redirect("/dashboard/loan");

  return res.redirect("/dashboard/lottery");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

module.exports = router;
