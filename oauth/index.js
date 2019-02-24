const oauthServer = require('oauth2-server');

const { Request, Response } = oauthServer;

const oauth = new oauthServer({
  model: require('./model'),
  // expire tokens after 4hrs
  accessTokenLifetime: 4 * 60 * 60
});

/**
 * authenticateHandler.handle() invoked by node-oauth2-server library
 */
const authenticateHandler = {
  handle(req) {
    // get authenticated user or falsy value. user object should already be attached to request (by Passport) if logged in.
    return req.user;
  }
};

/**
 * Middleware for protecting routes with token access.
 */
exports.authenticate = options => {
  options = options || {};
  return async (req, res, next) => {
    const request = new Request(req);
    const response = new Response(res);
    try {
      const token = await oauth.authenticate(request, response, options);

      // Request is authorized.
      res.locals.user = token.user;
      res.locals.client = token.client;

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 *
 * Handles the OAuth authorization flow
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
exports.authorize = async (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);
  try {
    // code appended to response header
    await oauth.authorize(request, response, {
      authenticateHandler
    });

    // redirect user agent
    res
      .status(response.status)
      .set(response.headers)
      .end();
  } catch (err) {
    next(err);
  }
};

/**
 * Generates access / refresh tokens for the client application.
 * @param {*} req Express request
 * @param {*} res Express response
 */
exports.token = async (req, res, next) => {
  const request = new Request(req);
  const response = new Response(res);
  try {
    // token set in response body
    await oauth.token(request, response);
    res.set(response.headers).json(response.body);
  } catch (err) {
    next(err);
  }
};
