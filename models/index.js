require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const {logger} = require('../constants');
const dbUri = process.env.DB_URI;

const sequelize = new Sequelize(dbUri, {
  logging: msg => {
    logger.debug(msg);
  },
  operatorsAliases: Sequelize.Op
});

const basename = path.basename(__filename);
const db = {};

// load all modules in current directory
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

// set associations on models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
