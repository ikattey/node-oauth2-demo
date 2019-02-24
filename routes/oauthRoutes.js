const {requireLoginWithRedirection} = require('../middleware');
module.exports = (router, oauth) => {

    /**
     * Handles token requests from registered clients
     */
    router.post('/token', oauth.token);

    /**
     * Used by frontend to obtain authorization code
     */
    router.get('/authorize', requireLoginWithRedirection, oauth.authorize);

    return router;
};