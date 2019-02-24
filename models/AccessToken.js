module.exports = (sequelize, DataTypes) => {
  const AccessToken = sequelize.define('AccessToken', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    token: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false }
  });

  AccessToken.associate = ({ User, Client }) => {
    AccessToken.belongsTo(User, {
      foreignKey: 'userId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    AccessToken.belongsTo(Client, {
      foreignKey: 'clientId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };

  return AccessToken;
};
