module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    token: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false }
  });

  RefreshToken.associate = ({ Client, User }) => {
    RefreshToken.belongsTo(User, {
      foreignKey: 'userId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    RefreshToken.belongsTo(Client, {
      foreignKey: 'clientId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };

  return RefreshToken;
};
