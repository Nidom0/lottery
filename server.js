require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const SQLiteStore = require("connect-sqlite3")(session);

const { sequelize } = require("./database");

// Models
const Admin = require("./models/Admin");
const Winner = require("./models/Winner");
const Template = require("./models/Template");

// Routes
const adminRoutes = require("./routes/admin");
const dashboardRoutes = require("./routes/dashboard");
const winnerRoutes = require("./routes/winner");
const templateRoutes = require("./routes/template");   // ✔ اضافه شد

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================
//   EJS TEMPLATE ENGINE
// ===========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===========================
//   STATIC FILES
// ===========================
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ===========================
//   SESSION
// ===========================
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: "./" }),
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 3 }, // ۳ ساعت
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session || {};
  next();
});

// ===========================
//   DEFAULT PAGE
// ===========================
app.get("/", (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect("/dashboard/lottery");
  }

  return res.redirect("/admin/login");
});

// ===========================
//   ROUTES
// ===========================
app.use("/admin", adminRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/winner", winnerRoutes);
app.use("/template", templateRoutes);       // ✔ روت تمپلیت فعال شد

// ===========================
//   404 PAGE
// ===========================
app.use((req, res) => {
  return res.status(404).render("404");
});

// ===========================
//   START SERVER
// ===========================
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    // ایجاد ادمین پیش‌فرض اگر وجود نداشت
    const defaultUser = process.env.ADMIN_USER || "admin";
    const defaultPass = process.env.ADMIN_PASS || "admin123";

    const exists = await Admin.findOne({ where: { username: defaultUser } });

    if (!exists) {
      await Admin.create({
        username: defaultUser,
        password: defaultPass,
      });

      console.log("✅ ادمین پیش‌فرض ساخته شد.");
    }

    app.listen(PORT, () =>
      console.log(`🚀 سرور روی http://localhost:${PORT} اجرا شد`)
    );
  } catch (err) {
    console.error("❌ خطا در راه‌اندازی سرور:", err);
  }
})();
