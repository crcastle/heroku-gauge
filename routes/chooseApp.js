var axios = require('axios');
var express = require('express');
var router = express.Router();

router.get('/', async function(req, res, next) {
  // get list of user's apps
  let response;
  try {
    response = await axios.get('https://api.heroku.com/apps', {
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3',
        'Authorization': `Bearer ${req.session.grant.response.access_token}`
      }
    });
  } catch(e) {
    next(e);
  }

  console.log(response.data);
  res.render('chooseApp', { apps: response.data });
});

module.exports = router;
