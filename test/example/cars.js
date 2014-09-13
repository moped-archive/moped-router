'use strict';

var assert = require('assert');
var Promise = require('promise');
var db = require('./db');
var MopedRouter = require('../../');
var app = new MopedRouter();

app.init(function (req) {
  return Promise.resolve(null).then(function () {
    req.makes = {volvo: 'dull', ferrari: 'exciting'};
  });
});
app.navigate('/:car', function (req) {
  // inside app.async, you can perform asynchronous operations
  // by returning a promise.

  return db.cars.findOne({_id: req.params.car}).then(function (car) {
    req.car = car;
    req.car.description = req.makes[req.params.car];
  });
});
app.render('/:car', function (req) {
  // inside app.get, you must always use synchronous code.
  // return `undefined` to delegate to another handler and `null` to indicate 404

  return JSON.stringify(req.car, null, '  ')
});



// handles posts to /cars/write-car where the body is a JSON array of
// [id, update]
// the first argument, `req` can be used for getting things like the
// authenticated user
app.onPost('/write-car', function (req, id, update) {
  return db.cars.update({_id: id}, update, {upsert: true});
});


app.onMount(function (basepath, parent) {
  assert(basepath === app.basepath);
  assert(parent === app.parent);
});

module.exports = app;
