var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { oauthUrl: 'http://localhost:5000/connect/heroku' });
});

module.exports = router;