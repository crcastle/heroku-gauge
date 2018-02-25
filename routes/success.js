var express = require('express');
var router = express.Router();

// Return success!
router.get('/', function(req, res, next) {
  res.render('success', {
    // app: req.query.app,
    // device: req.query.device,
    // deviceToken: req.body.deviceToken,
    // host: req.hostname
  });
});

module.exports = router;
