'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AV = require('leanengine');
var countries = require('./utils/countries');

// load the cloud function
require('./cloud');

var app = express();

// template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(timeout('15s'));

// Leancloud middle ware
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
// app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() });
});

app.get('/pinger', function(req, res) {
  res.send(countries)
  console.log('hey, u pinged me. thanks for waking me up.')
})

app.get('/countries', function(req, res) {
  res.send(countries);
});

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  // if a path has no response, throw a 404 and deal with error at next
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // ignore websocket timeouts
    return;
  }

  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // don't print error details by default
  var error = {};
  if (app.get('env') === 'development') {
    // render errors on page if in dev environment
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;
