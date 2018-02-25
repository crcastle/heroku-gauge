var express = require('express');
var router = express.Router();

var db = require('../db');

router.post('/', async function(req, res, next) {
  // Save query string data to database
  await db.saveConfiguration({
    appName: req.query.app,
    deviceName: req.query.device,
    deviceToken: req.body.deviceToken,
    hostname: req.hostname
  });

  // Return success!
  res.redirect('/success');
  // res.render('save', {
  //   app: req.query.app,
  //   device: req.query.device,
  //   deviceToken: req.body.deviceToken,
  //   host: req.hostname
  // });
});

module.exports = router;
