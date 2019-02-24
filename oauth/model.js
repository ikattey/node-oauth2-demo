const {
  AccessToken,
  RefreshToken,
  Client,
  User,
  AuthCode,
  GrantType,
  sequelize
} = require('../models');

const { logger } = require('../constants');

/**
 * Invoked to retrieve an existing access token previously saved through the saveToken() function
 * This model function is required if the authenticate() middleware from the node-oauth2-server library is used.
 *
 * @param {String} token The access token to retrieve.
 * @returns An Object representing the access token and associated data.
 */
exports.getAccessToken = async token => {
  try {
    const dbToken = await AccessToken.findOne({
      where: {
        token
      }
    });

    if (!dbToken) return false;

    return {
      accessToken: dbToken.token,
      accessTokenExpiresAt: dbToken.expiresAt,
      client: { id: dbToken.clientId },
      user: { id: dbToken.userId }
    };
  } catch (err) {
    logger.warn(`Error retrieving access token ${token}:`, err.message);
  }
};

/**
 * Invoked to retrieve a client using a client id or a client id/client secret combination, depending on the grant type.
 * This model function is required for all grant types.
 * @param {String} clientId The client id of the client to retrieve.
 * @param {String} clientSecret The client secret of the client to retrieve. Can be null.
 *
 * @returns An Object representing the client and associated data, or a falsy value if no such client could be found.
 */
exports.getClient = async (clientId, clientSecret) => {
  try {
    const params = {
      id: clientId
    };

    // add clientSecret to query if specified
    if (clientSecret) {
      params.secret = clientSecret;
    }

    const client = await Client.findOne({
      where: params,
      include: [
        {
          model: GrantType,
          // we're only interested in the GrantType value property
          attributes: ['value']
        }
      ]
    });

    return {
      id: client.id,
      // redirectUris expects an array
      redirectUris: [client.redirectUri || ''],
      grants: client.GrantTypes.map(g => g.get('value'), { plain: true })
    };
  } catch (err) {
    logger.warn(`Error retrieving client ${clientId}:`, err.message);
  }
};

/**
 *
 * Invoked to save an access token and optionally a refresh token, depending on the grant type.
 * This model function is required for all grant types.
 * @param {Object} token The token(s) to be saved.
 * @param {Object} client The client associated with the token(s).
 * @param {Object} user The user associated with the token(s).
 * @returns An Object representing the token(s) and associated data.
 */
exports.saveToken = async (token, client, user) => {
  try {
    const [txAccessToken, txRefreshToken] = await sequelize.transaction(
      async t => {
        const transactionOpts = { transaction: t };
        const savedAccessToken = await AccessToken.create(
          {
            token: token.accessToken,
            expiresAt: token.accessTokenExpiresAt,
            userId: user.id,
            clientId: client.id
          },
          transactionOpts
        );

        // save refresh token (if provided) within same transaction context
        const savedRefreshToken = !token.refreshToken
          ? []
          : await RefreshToken.create(
              {
                token: token.refreshToken,
                expiresAt: token.refreshTokenExpiresAt,
                userId: user.id,
                clientId: client.id
              },
              transactionOpts
            );
        //return insertion results from transaction
        return [savedAccessToken, savedRefreshToken];
      }
    );

    return {
      accessToken: txAccessToken.token,
      accessTokenExpiresAt: txAccessToken.expiresAt,
      refreshToken: txRefreshToken.token,
      refreshTokenExpiresAt: txRefreshToken.expiresAt,
      client: { id: txAccessToken.clientId },
      user: { id: txAccessToken.userId }
    };
  } catch (error) {
    logger.warn(
      `Error saving access token for user=${user.id} client=${client.id}`
    );
  }
};

/**
 * Invoked to retrieve a user using a username/password combination.
 * This model function is required if the password grant is used.
 * @param {*} username The username of the user to retrieve.
 * @param {*} password The user's password.
 */
exports.getUser = async (username, password) => {
  try {
    return User.getWithCredentials(username, password);
  } catch (err) {
    logger.warn(`Error getting user ${username}:`, err.message);
  }
};

/**
 * Invoked to retrieve the user associated with the specified client.
 * This model function is required if the client_credentials grant is used.
 * @param clientId A unique string identifying the client.
 * @param clientSecret Client secret
 * @returns  An Object representing the user, or a falsy value if the client does not have an associated user.
 * The user object is completely transparent to oauth2-server and is simply used as input to other model functions.
 */
exports.getUserFromClient = async client => {
  try {
    const params = {
      where: { id: client.id },
      include: [{ model: User }]
    };

    // include client secret in query params if also in request
    if (client.secret) {
      params.where.secret = client.secret;
    }

    const dbClient = await Client.findOne(params);
    return (dbClient && dbClient.User) || false;
  } catch (error) {
    logger.warn(error.message);
  }
};

/**
 * Queries the database for an Authorization Code with the specified value.
 * Also includes the associated Client, User and Scopes for the Authorization Code.
 * @param {String} authorizationCode The refresh token to retrieve.
 * @returns {Object} An Object representing the authorization code and associated data.
 */
exports.getAuthorizationCode = async authorizationCode => {
  try {
    const dbCode = await AuthCode.findOne({
      where: {
        code: authorizationCode
      }
    });

    if (!dbCode) return null;
    return {
      code: dbCode.code,
      expiresAt: dbCode.expiresAt,
      redirectUri: dbCode.redirectUri,
      client: { id: dbCode.clientId },
      user: { id: dbCode.userId }
    };
  } catch (err) {
    logger.warn(
      `Error retrieving authorization code ${authorizationCode}:`,
      err.message
    );
  }
};

/**
 * Inserts the given authorization code in the database, together with its associated user, client and scopes.
 * Database insertions occur within a transaction.
 * @param {Object} code The code to be saved
 *  @param {Object} code.authorizationCode The authorization code to be saved.
 *  @param {Date} code.expiresAt The expiry time of the authorization code.
 *  @param {String} code.redirectUri The redirect URI associated with the authorization code.
 *  @param {String[]} code.scope The authorized scope(s) of the authorization code.
 *  @param {Object} client The client associated with the authorization code.
 *  @param {String} client.id Unique identifier for the client
 *  @param {String} user The user associated with the authorization code.
 * @param {String} user.id Unique identifier for the user
 * @returns {Object} An Object representing the authorization code and associated data.
 */
exports.saveAuthorizationCode = async (code, client, user) => {
  try {
    const savedAuthCode = await AuthCode.create({
      code: code.authorizationCode,
      clientId: client.id,
      userId: user.id,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri
    });

    return {
      authorizationCode: savedAuthCode.code,
      expiresAt: savedAuthCode.expiresAt,
      redirectUri: savedAuthCode.redirectUri,
      client: { id: savedAuthCode.clientId },
      user: { id: savedAuthCode.userId }
    };
  } catch (err) {
    logger.warn(
      `Error saving authorization code ${code.authorizationCode}:`,
      err.message
    );
  }
};

/**
 * Queries the database for a RefreshToken with the specified 'token' field
 * Also includes the associated Client, User and Scopes for the RefreshToken.
 * @param {String} token The refresh token to retrieve.
 * @returns {Object} An Object representing the refresh token and associated data.
 */
exports.getRefreshToken = async token => {
  try {
    const dbToken = await RefreshToken.findOne({
      where: {
        token
      }
    });

    if (!dbToken) return null;
    return {
      refreshToken: dbToken.token,
      refreshTokenExpiresAt: dbToken.expiresAt,
      client: { id: dbToken.clientId },
      user: { id: dbToken.userId }
    };
  } catch (err) {
    logger.warn(`Error getting refresh token ${token}:`, err.message);
  }
};

/**
 * Invoked to revoke an authorization code.
 * This model function is required if the authorization_code grant is used.
 * @param {*} authCode The code to revoke
 * @returns true if the revocation was successful or false if the authorization code could not be found.
 */
exports.revokeAuthorizationCode = async authCode => {
  try {
    const numDeletedRows = await AuthCode.destroy({
      where: {
        code: authCode.code
      }
    });

    return numDeletedRows > 0;
  } catch (err) {
    logger.warn(`Error deleting authorization code ${authCode}:`, err.message);
  }
};

/**
 * Invoked to revoke a refresh token.
 * This model function is required if the refresh_token grant is used.
 * @param {Object} token The token to be revoked.
 * @returns true if the revocation was successful or false if the refresh token could not be found.
 */
exports.revokeToken = async token => {
  try {
    const numDeletedRows = await RefreshToken.destroy({
      where: {
        token: token.refreshToken
      }
    });

    return numDeletedRows > 0;
  } catch (err) {
    logger.warn(`Error deleting refresh token ${token}:`, err.message);
  }
};
