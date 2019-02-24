const { GRANT_TYPES, JOIN_TABLES } = require('../constants');
module.exports = (sequelize, DataTypes) => {
  const GrantType = sequelize.define('GrantType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    value: {
      allowNull: false,
      unique: true,
      type: DataTypes.ENUM(...GRANT_TYPES)
    }
  });

  GrantType.associate = ({ Client }) => {
    GrantType.belongsToMany(Client, { through: JOIN_TABLES.clientGrantType });
  };
  
  /**
   * Finds GrantTypes matching the given value strings
   * @param {*} values array containing values
   */
  GrantType.findByValue = values => {
    return GrantType.findAll({
      where: {
        value: {
          // select * from GrantTypes where type matches any of the provided strings
          [sequelize.Op.in]: values
        }
      }
    });
  };

  return GrantType;
};
