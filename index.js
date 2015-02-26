'use strict';

var assert = require('assert');
var Promise = require('promise');
var toRegex = require('path-to-regexp');
var clone = require('clone');
var isPromise = require('is-promise');
var methods = require('./lib/methods');
var Route = require('./lib/route.js');

module.exports = MopedRouter;
function MopedRouter() {
  if (!(this instanceof MopedRouter)) {
    throw new TypeError('MopedRouter must be called as a constructor');
  }
  this.handlers = [];
  this.baseExpression = null;
  this.baseKeys = [];
  this.parent = null;
  this.mounted = false;
}
MopedRouter.prototype._mount = function (basepath, parent) {
  if (this.mounted) {
    throw new Error('Cannot mount the same app a second time.');
  }
  this.mounted = true;
  this.baseExpression = toRegex(basepath, this.baseKeys, {end: false});
  this.parent = parent;
};


MopedRouter.prototype.use = function (path, child) {
  if (arguments.length === 1) {
    child = path;
    path = '/';
  }
  if (typeof path !== 'string') {
    throw new TypeError('Expected the path to be a string but got ' + (typeof path) + ' in MopedRouter.use');
  }
  if (!child || typeof child._mount !== 'function' || typeof child.handle !== 'function') {
    throw new TypeError('child to mount must be a moped-router in MopedRouter.use');
  }
  child._mount(path, this);
  this.handlers.push(child);
};

function mounter(type) {
  return function (path) {
    if (typeof path !== 'string') {
      throw new TypeError('Expected the path to be a string but got ' + (typeof path));
    }
    if (arguments.length < 2) {
      throw new TypeError('Expected at least one handler');
    }
    for (var i = 1; i < arguments.length; i++) {
      var handler = arguments[i];
      if (typeof handler !== 'function') {
        throw new TypeError('Expected the handlers to be functions but got ' + (typeof handler));
      }
      this.handlers.push(new Route(type, path, handler));
    }
  };
}
methods.concat(['all']).forEach(function (method) {
  MopedRouter.prototype[method] = mounter(method);
});

MopedRouter.prototype.handle = function (req) {
  if (typeof req.method !== 'string') {
    return Promise.reject(new TypeError('req.method must be a string for moped-router to work'));
  }
  if (methods.indexOf(req.method) === -1) {
    return Promise.reject(new TypeError('req.method must be a supported method for moped-router to work'));
  }
  if (typeof req.path !== 'string') {
    return Promise.reject(new TypeError('req.path must be a string for moped-router to work'));
  }
  if (req.url) {
    if (typeof req.url !== 'string') {
      return Promise.reject(new TypeError('req.url must be a string if present'));
    }
    if (req.url.substr(0, req.path.length) !== req.path) {
      return Promise.reject(new TypeError('req.url must start with req.path if present'));
    }
  }
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  var before = {
    path: req.path,
    url: req.url,
    params: req.params
  };
  req.params = clone(req.params || {});
  var basePath = '';
  if (this.mounted) {
    var match = this.baseExpression.exec(req.path);
    if (!match) {
      return Promise.resolve(undefined);
    }
    basePath = match[0];
    for (var i = 0; i < this.baseKeys.length; i++) {
      req.params[this.baseKeys[i].name] = match[i + 1];
    }
    req.path = req.path.substr(match[0].length);
    assert(req.path[0] === '/', 'Expected path to start with a "/"');
    if (req.url) {
      req.url = req.url.substr(match[0].length);
      assert(req.path[0] === '/', 'Expected path to start with a "/"');
    }
  }
  req.onEnterRouter && req.onEnterRouter(basePath);
  var handlers = this.handlers;
  return new Promise(function (resolve, reject) {
    var i = 0;
    function next() {
      while (true) {
        if (i >= handlers.length) {
          return resolve(undefined);
        }
        var nextResult;
        try {
          nextResult = handlers[i++].handle(req, args);
        } catch (ex) {
          return reject(ex);
        }
        if (nextResult !== undefined) {
          if (isPromise(nextResult)) {
            return nextResult.done(function (res) {
              if (res === undefined) next();
              else resolve(res);
            }, reject);
          } else {
            return resolve(nextResult);
          }
        }
      }
    }
    next();
  }).then(function (res) {
    if (res === undefined) {
      Object.keys(before).forEach(function (key) {
        req[key] = before[key];
      });
      req.onExitRouter && req.onExitRouter(basePath);
    }
    return res;
  });
};
