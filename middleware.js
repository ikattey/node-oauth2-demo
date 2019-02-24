const url = require('url');

/**
 * Validates that the request contains a user property. Since passport sets this property when the user logs in,
 * requests without it have not been authenticated.
 * Redirects to the frontend login page, with the original URL appended as a query parameter
 */
exports.requireLoginWithRedirection = (req, res, next) => {
  // passport appends a user object on authenticated requests
  if (!req.user) {
    // redirect to login page
    const urlFormat = {
      pathname: '/',
      // append originalUrl as a 'redirect' query param
      query: { redirect: req.originalUrl }
    };

    return res.redirect(url.format(urlFormat));
  }

  // request is authenticated. append req.user to res.locals
  res.locals.user = req.user;
  next();
};

/**
 * Similar to requireLoginWithRedirection, this middleware function returns a 401 if user is not logged in.
 */
exports.requireLogin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  res.locals.user = req.user;
  next();
};
