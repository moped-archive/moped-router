'use strict';

var Promise = require('promise');

exports.cars = {};
exports.cars.findOne = function (query) {
  return Promise.resolve(query);
};

exports.cars.update = function (query, update, options) {
  return {ok: 1};
};
