const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Winner = sequelize.define("Winner", {
  fullName: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  linkId: DataTypes.STRING,
  viewed: { type: DataTypes.BOOLEAN, defaultValue: false },
  infoComplete: { type: DataTypes.BOOLEAN, defaultValue: false },
  registrationCode: DataTypes.STRING,
  registrationUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
  accountPassword: DataTypes.STRING,
  prize: DataTypes.STRING,
  description: DataTypes.TEXT,
  avatar: DataTypes.STRING,
  qrcode: DataTypes.STRING,
  documents: DataTypes.TEXT
});

module.exports = Winner;
