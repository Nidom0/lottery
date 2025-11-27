// database.js
const { Sequelize } = require("sequelize");
const path = require("path");

// مسیر فایل دیتابیس
const dbPath = path.join(__dirname, "db", "lottery.db");

// اتصال به SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false, // لاگ‌های اضافی را خاموش می‌کند
});

// تست اتصال
(async () => {
  try {
    await sequelize.authenticate();
    console.log("📌 اتصال موفق به دیتابیس SQLite");

    // بعد از لود مدل‌ها sync انجام می‌شود
  } catch (err) {
    console.error("❌ خطا در اتصال به دیتابیس:", err);
  }
})();

module.exports = { sequelize };
console.log("DB PATH:", dbPath);
