'use strict';

var db = require('./db');
var MopedRouter = require('../../');
var app = new MopedRouter();

app.async('/:car', function (req) {
  // inside app.async, you can perform asynchronous operations
  // by returning a promise.

  return db.cars.findOne({_id: req.params.car}).then(function (car) {
    req.car = car;
  });
});
app.get('/:car', function (req) {
  // inside app.get, you must always use synchronous code.
  // return `undefined` to delegate to another handler and `null` to indicate 404

  return JSON.stringify(req.car, null, '  ')
});


// handles posts to /cars/write-car where the body is a JSON array of
// [id, update]
// the first argument, `req` can be used for getting things like the
// authenticated user
app.post('/write-car', function (req, id, update) {
  return db.cars.update({_id: id}, update, {upsert: true});
});

module.exports = app;
