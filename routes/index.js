const oauth = require('../oauth');


module.exports = router => {
  router.use('/api', require('./apiRoutes')(router, oauth));
  router.use('/oauth', require('./oauthRoutes')(router, oauth));
  return router;
};
