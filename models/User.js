const bcrypt = require('bcryptjs');
const BCRYPT_SALT_ROUNDS = 12;


const foreignKeyOpts = {
  foreignKey: 'userId',
  onDelete: 'cascade'
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }
  });

  /**
   * Compares the given password against the hash stored in the database
   * @param {String} candidatePassword password to compare
   */
  User.prototype.validatePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  /**
   * Class method on model to retrieve user with matching password
   */
  User.getWithCredentials = async function(username, password) {
    const user = await User.findOne({
      where: { username }
    });

    if (!user || !user.validatePassword(password)) return false;
    return {
      id: user.id,
      username: user.username
    };
  };

  User.getWithId = async function(id) {
    const user = await User.findOne({
      where: { id },
      attributes: ['id', 'username']
    });

    return user;
  };

  /**
   * Encrypt password before saving users to database
   */
  User.beforeCreate(async user => {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
  });

  User.associate = ({ AccessToken, Client, AuthCode, RefreshToken }) => {
    User.belongsTo(Client,  {
      foreignKey: 'clientId',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    User.hasMany(AccessToken, foreignKeyOpts);
    User.hasMany(AuthCode, foreignKeyOpts);
    User.hasMany(RefreshToken, foreignKeyOpts);
  };

  return User;
};
