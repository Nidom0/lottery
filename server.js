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
const customerRoutes = require("./routes/customer");

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
  return res.render("index");
});

app.get("/contact", (req, res) => res.render("contact"));

app.get("/loans", (_req, res) => res.redirect("/loans/gold"));
app.get("/loans/gold", (_req, res) => res.render("loan-gold"));
app.get("/loans/housing", (_req, res) =>
  res.render("info-page", {
    title: "وام خرید مسکن",
    subtitle: "طرح‌های خرید و ساخت مسکن با ضمانت طلا",
    sections: [
      { title: "شرایط کلی", body: "امکان دریافت تسهیلات خرید یا ساخت مسکن با پشتوانه طلای ۱۸ عیار و اقساط شناور." },
      { title: "مدارک لازم", body: "کارت ملی، اطلاعات بانکی و مدارک ملک جهت بررسی کارشناسی." },
    ],
    links: [{ href: "/contact", label: "ارتباط با پشتیبانی" }],
  })
);

app.get("/loans/car", (_req, res) =>
  res.render("info-page", {
    title: "وام خرید خودرو",
    subtitle: "تسهیلات خرید خودرو با حداقل پیش‌پرداخت",
    sections: [
      { title: "پیش‌پرداخت", body: "حداقل پیش‌پرداخت و امکان ارائه وثیقه طلا برای تسریع فرایند." },
      { title: "گستره خدمات", body: "امکان تامین مالی برای خودروهای نو و کارکرده تحت قوانین داخلی." },
    ],
    links: [{ href: "/contact", label: "سوالات بیشتر" }],
  })
);

app.get("/lottery/winners", (_req, res) =>
  res.render("info-page", {
    title: "برندگان قرعه‌کشی",
    subtitle: "اطلاعات و روند اعلام برندگان",
    sections: [
      { title: "شفافیت", body: "برندگان پس از تایید اطلاعات و تمپلیت انتخابی در این بخش اطلاع‌رسانی می‌شوند." },
      { title: "مراجعه سریع", body: "از طریق لینک ارسالی، هر برنده می‌تواند صفحه اختصاصی خود را مشاهده کند." },
    ],
    links: [{ href: "/customer/login", label: "ورود برندگان" }],
  })
);

app.get("/lottery/about", (_req, res) =>
  res.render("info-page", {
    title: "درباره قرعه‌کشی",
    subtitle: "قوانین و فرآیند اجرا",
    sections: [
      { title: "نحوه شرکت", body: "ثبت‌نام، دریافت کد و تکمیل اطلاعات هویتی برای ورود به قرعه‌کشی الزامی است." },
      { title: "کنترل امنیت", body: "تمامی لینک‌ها و تمپلیت‌ها از طریق داشبورد ادمین ساخته می‌شوند تا از سوءاستفاده جلوگیری شود." },
    ],
    links: [{ href: "/contact", label: "گزارش مشکل" }],
  })
);

// ===========================
//   ROUTES
// ===========================
app.use("/admin", adminRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/winner", winnerRoutes);
app.use("/template", templateRoutes);       // ✔ روت تمپلیت فعال شد
app.use("/customer", customerRoutes);

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
    await sequelize.sync({ alter: true });

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
