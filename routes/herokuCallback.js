var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  if (req.session.grant.response) {
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
