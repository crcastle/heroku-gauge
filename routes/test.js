var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    message: 'hello!',
    hits: 74576
  })
});

module.exports = router;
