const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Template = sequelize.define("Template", {
  title: DataTypes.STRING,
  companyName: DataTypes.STRING,
  dateText: DataTypes.STRING,
  namePlaceholder: DataTypes.STRING,
  phonePlaceholder: DataTypes.STRING
});

module.exports = Template;
