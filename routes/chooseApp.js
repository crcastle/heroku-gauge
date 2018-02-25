var axios = require('axios');
var express = require('express');
var router = express.Router();

var TokenProvider = require('../lib/tokenProvider');
var tokenProvider = new TokenProvider();

// get list of user's apps
router.get('/', async function(req, res, next) {
  const headers = {
    'Accept': 'application/vnd.heroku+json; version=3',
    'Authorization': `Bearer ${await tokenProvider.getActiveToken()}`
  };

  let data = [];
  try {
    // get first "page"
    let response = await axios.get('https://api.heroku.com/apps', { headers });
    data.push(...response.data);

    // Get additional pages of data, if available
    while (response.status === 206) {
      const newHeaders = {
        ...headers,
        range: response.headers['next-range']
      };
      response = await axios.get('https://api.heroku.com/apps', { headers: newHeaders });
      data.push(...response.data);
    }
  } catch(e) {
    // pass the error on to the next middleware, e.g. error handling middleware
    next(e);
  }

  res.render('chooseApp', { apps: data });
});

module.exports = router;
