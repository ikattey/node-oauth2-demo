module.exports = (sequelize, DataTypes) => {
  const AuthCode = sequelize.define('AuthCode', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    code: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    redirectUri: { type: DataTypes.STRING }
  });

  AuthCode.associate = ({ Client, User }) => {
    AuthCode.belongsTo(User, {
      foreignKey: 'userId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    AuthCode.belongsTo(Client, {
      foreignKey: 'clientId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };

  return AuthCode;
};
