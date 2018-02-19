var express = require('express');
var router = express.Router();
var TokenProvider = require('../lib/tokenProvider');
var tokenProvider = new TokenProvider();

var config = require('../config.js')[process.env.NODE_ENV || 'development'];

router.get('/', function(req, res, next) {
  if (req.session.grant.response) {
    console.log(`Got API access token`);
    tokenProvider.setToken(req.session.grant.response.raw);
    tokenProvider.setUrl(config.oauth.tokenUrl);
    res.redirect('/2');
  } else {
    // else destroy the session and start over
    new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) return reject(err);
        return resolve();
      })
    })
    .then(() => {
      res.redirect('/');
    })
    .catch(err => {
      res.status(500).send(err);
    })
  }


});

module.exports = router;
