var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('selectDevice', {
    app: req.query.app,
    devices: ['M5Stack', 'Pixel Board']
  });
});

module.exports = router;
