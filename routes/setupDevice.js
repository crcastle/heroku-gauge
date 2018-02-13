var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('setupDevice', {
    app: req.query.app,
    device: req.query.device,
    host: req.hostname,
    deviceToken: process.env['DEVICE_TOKEN'],
  });
});

module.exports = router;
