const { JOIN_TABLES } = require('../constants');
const foreignKeyOpts = {
  foreignKey: 'clientId',
  onDelete: 'cascade',
  onUpdate: 'cascade'
};

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: { type: DataTypes.STRING, allowNull: true },
    secret: { type: DataTypes.STRING, allowNull: false },
    redirectUri: { type: DataTypes.STRING, allowNull: true }
  });

  Client.associate = ({
    AccessToken,
    GrantType,
    User,
    AuthCode,
    RefreshToken
  }) => {
    Client.belongsToMany(GrantType, { through: JOIN_TABLES.clientGrantType });
    //client -user. required for client_credentials grant.
    Client.hasOne(User, foreignKeyOpts);
    Client.hasMany(AccessToken, foreignKeyOpts);
    Client.hasMany(AuthCode, foreignKeyOpts);
    Client.hasMany(RefreshToken, foreignKeyOpts);
  };

  return Client;
};
