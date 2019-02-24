const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const uuidv4 = require('uuid/v4');
const { logger } = require('./constants');
const app = express();
const router = express.Router();

app.use(
  session({
    secret: uuidv4(),
    maxAge: 60 * 60 * 1000, //1hr
    resave: false,
    saveUninitialized: true
  })
);

// configure http request logging
app.use(
  morgan('combined', {
    stream: logger.stream
  })
);

//allow cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// setup passport
require('./passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(require('./routes')(router));
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({ error: err });
});

module.exports = app;
