var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('selectDevice', { devices: ['one', 'two', 'three'] });
});

module.exports = router;
