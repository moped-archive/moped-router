'use strict';

var toRegex = require('path-to-regexp');

module.exports = Route;
function Route(type, path, handler) {
  this.type = type;

  this.keys = [];
  this.regex = toRegex((path === '*') ? '(.*)' : path, this.keys);
  this.handler = handler;
}
Route.prototype.handle = function (req) {
  var match;
  req.params = {};
  if (match = this.regex.exec(req.path)) {
    for (var i = 0; i < this.keys.length; i++) {
      req.params[this.keys[i].name] = match[i + 1];
    }
    return this.handler.apply(null, arguments);
  }
};
Route.prototype._mount = function () {};
Route.prototype.handleAsync = function (req) {
  if (this.type === 'sync' || this.type === 'async') {
    return this.handle.apply(this, arguments);
  }
};
Route.prototype.handleSync = function (req) {
  if (this.type === 'sync') {
    return this.handle.apply(this, arguments);
  }
};
Route.prototype.handlePost = function (req) {
  if (this.type === 'post') {
    return this.handle.apply(this, arguments);
  }
};
