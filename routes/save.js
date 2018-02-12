var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  // Save query string data to database

  // Return success!
  res.render('save', {
    app: req.query.app,
    device: req.query.device,
    host: req.hostname
  });
});

module.exports = router;
