var express = require('express');
var router = express.Router();
var TokenProvider = require('../lib/tokenProvider');
var tokenProvider = new TokenProvider();
var debug = require('debug')('heroku-gauge:herokuCallback');

// var config = require('../config.js')[process.env.NODE_ENV || 'development'];

router.get('/', async function(req, res, next) {
  const token = req.query.raw;
  debug(`Access token:`, token);
  if (token) {
    console.log(`Got API access token`);
    await tokenProvider.setToken(token);

    res.redirect('/2');
  } else { // destroy the session and start over
    debug(`Login failed`,)

    try {
      await new Promise((resolve, reject) => {
        req.session.destroy(err => {
          if (err) return reject(err);
          return resolve();
        });
      });
      res.redirect('/');
    } catch(err) {
      res.status(500).send(err);
    }
  }


});

module.exports = router;
