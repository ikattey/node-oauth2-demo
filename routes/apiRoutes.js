const uuidv4 = require('uuid/v4');
const passport = require('passport');
const { logger } = require('../constants');
const { User, Client, GrantType, sequelize } = require('../models');

const handleLogin = (req, res, next) => {
  const { username, password } = req.body;
  passport.authenticate('local', { username, password }, function(
    err,
    retrievedUser,
    info
  ) {
    // handle uncaught errors
    if (err) {
      logger.warn(
        'Passport authentication failed. username=%s',
        req.path,
        username,
        err.code
      );
      return res.status(401).json({ error: info || err.code });
    }

    //No user found.
    if (!retrievedUser) {
      return res.status(401).json({ error: 'Login failed' });
    }

    // establish a login session
    req.logIn(retrievedUser, function(err) {
      if (err) {
        logger.warn(
          'Login attempt failed for user %s - %j',
          retrievedUser.username,
          err
        );
        return next(err);
      }
      logger.info('%s successfully logged in', retrievedUser.username);
      res.json({ message: 'Login successful' });
    });
  })(req, res, next);
};
/**
 * Handles user registration requests.
 */
const handleUserRegistration = async (req, res) => {
  const { username, password } = req.body;

  if (!(username && password)) {
    return res.status(422).json({ error: 'username and password required' });
  }

  try {
    const user = await User.create({
      username,
      password
    });

    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (err) {
    logger.warn(`Error creating user ${username}`, err);
    res.status(500).json({ error: 'User not created' });
  }
};

/**
 * Used by clients with a valid token to retrieve information about the user for whom
 * that token was granted.
 */
const handleGetUser = async (req, res) => {
  try {
    const user = await User.getWithId(res.locals.user.id);
    return res.json(user);
  } catch (err) {
    logger.warn(
      'Error getting user info. res.locals=%j',
      res.locals,
      err.message
    );
    res.status(500).json({ error: 'Error retrieving user' });
  }
};

/**
 * Handler for client registration requests
 */
const handleClientRegistration = async (req, res) => {
  const { name, redirectUri, grants, user } = req.body;

  if (!(name && redirectUri && grants)) {
    return res.status(422).json({
      error: 'The following fields are required: name, redirectUri and grants'
    });
  }

  const queryParams = { name, redirectUri };

  // create User if req includes a user object
  if (user && user.username) {
    queryParams.User = {
      username: user.username,
      password: user.password
    };
  }

  try {
    // map grants to known database GrantTypes
    const grantEntities = await GrantType.findByValue(grants);

    if (grantEntities.length < grants.length) {
      throw Error(`Unknown grant included in request: ${grants} `);
    }

    queryParams.secret = uuidv4();

    // insert within transaction
    const txClient = await sequelize.transaction(async t => {
      const transactionOpts = { transaction: t };
      const client = await Client.create(
        queryParams,
        {
          // include association for user if req included a user object
          include: queryParams.User ? [User] : null
        },
        transactionOpts
      );

      // associate existing GrantTypes with new client.
      await client.setGrantTypes(grantEntities, transactionOpts);

      return client;
    });

    res.json({
      client: {
        id: txClient.id,
        secret: txClient.secret,
        redirectUri: txClient.redirectUri,
        // client.user could be empty
        user: !txClient.User
          ? {}
          : // extract 'id' and 'username' from associated user
            { id: txClient.User.id, username: txClient.User.username }
      }
    });
  } catch (err) {
    logger.warn('Error registering client', err.message);
    return res.status(422).json({ error: 'Failed to register client' });
  }
};

module.exports = (router, oauth) => {
  router.post('/user/register', handleUserRegistration);
  router.post('/user/login', handleLogin);
  router.get('/user', oauth.authenticate(), handleGetUser);
  router.post('/client/register', handleClientRegistration);
  return router;
};
