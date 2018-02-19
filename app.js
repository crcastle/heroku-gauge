var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var Grant = require('grant-express');

var config = require('./config.js');

var index = require('./routes/index');
var login = require('./routes/login');
var herokuCallback = require('./routes/herokuCallback');
var chooseApp = require('./routes/chooseApp');
var selectDevice = require('./routes/selectDevice');
var setupDevice = require('./routes/setupDevice');
var save = require('./routes/save');

var grant = new Grant(config[process.env.NODE_ENV || 'development']['oauth']);

var app = express();

// Redirect all HTTP traffic to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    app.enable('trust proxy', 'loopback')
    if (req.secure) {
      return next()
    }
    res.redirect(`https://${req.hostname}${req.url}`)
  })
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(session({ secret: 'very secret', resave: false, saveUninitialized: false }));
app.use(grant);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/1', login);
app.use('/handle_heroku_callback', herokuCallback);
app.use('/2', chooseApp);
app.use('/3', selectDevice);
app.use('/4', setupDevice);
app.use('/save', save);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
