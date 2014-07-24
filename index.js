'use strict';

var Promise = require('promise');
var asap = require('asap');
var Route = require('./lib/route.js');

module.exports = App;
function App() {
  this.handlers = [];
}
App.prototype._mount = function (basepath, parent) {
  this.basepath = basepath;
  this.parent = parent;
};

App.prototype.use = function (path, child) {
  if (arguments.length === 0) {
    child = path;
    path = '/';
  }
  if (typeof path !== 'string') {
    throw new TypeError('Expected the path to be a string but got ' + (typeof path));
  }
  var specialCharacters = path.replace(/[a-z0-9\-\/]/g, '');
  if (specialCharacters !== '') {
    throw new Error('The path in `app.use` may not contain special characters, such as ' + specialCharacters);
  }
  if (!child || typeof child._mount !== 'function' || typeof child.handleAsync !== 'function' || typeof child.handleSync !== 'function' || typeof child.handlePost !== 'function') {
    throw new TypeError('child to mount must be a moped-router');
  }
  child._mount(path, this);
  this.handlers.push(child);
};

function mounter(type) {
  return function (path, handler) {
    if (arguments.length === 0) {
      handler = path;
      path = '*';
    }
    if (typeof path !== 'string') {
      throw new TypeError('Expected the path to be a string but got ' + (typeof path));
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Expected the handler to be functions but got ' + (typeof handler));
    }
    this.handlers.push(new Route(type, path, handler));
  };
}
App.prototype.async = mounter('async');
App.prototype.get = mounter('sync');
App.prototype.post = mounter('post');

function handler(method) {
  return function (req) {
    if (typeof req.path !== 'string') {
      return Promise.reject(new TypeError('req.path must be a string for moped-router to work'));
    }
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var handlers = this.handlers;
    var restore;
    if (restore = matchBasePath(req, this.basepath)) {
      return new Promise(function (resolve, reject) {
        function next(i) {
          try {
            if (i >= handlers.length) return resolve(undefined);
            var nextResult = handlers[i][method].apply(handlers[i], args);

            // use asap to break infinite loop
            if (nextResult === undefined) return asap(next.bind(null, i + 1));
            Promise.resolve(nextResult).done(function (res) {
              if (res === undefined) next(i + 1);
              else resolve(res);
            }, reject);
          } catch (ex) {
            reject(ex);
          }
        }
        next(0);
      }).then(function (res) {
        restore();
        return res;
      });
    } else {
      return Promise.resolve(undefined);
    }
  };
}

function matchBasePath(req, basepath) {
  var originalPath, originalUrl;
  if (basepath) {
    if (req.path.substr(0, basepath.length).toLowerCase() !== basepath) {
      return false;
    }
    originalPath = req.path;
    req.path = originalPath.substr(basepath.length);
    if (req.path[0] !== '/') req.path = '/' + req.path;
    if (req.url) {
      originalUrl = req.url;
      req.url = originalUrl.substr(basepath.length);
      if (req.url[0] !== '/') req.url = '/' + req.url;
    }
    return function () {
      req.path = originalPath;
      if (req.url) {
        req.url = originalUrl;
      }
    };
  } else {
    return function noop() {};
  }
}
App.prototype.handleAsync = handler('handleAsync');
App.prototype.handlePost = handler('handlePost');
App.prototype.handleSync = function (req) {
  if (typeof req.path !== 'string') {
    throw new TypeError('req.path must be a string for moped-router to work');
  }
  var restore;
  if (restore = matchBasePath(req, this.basepath)) {
    var result;
    for (var i = 0; i < this.handlers.length; i++) {
      result = this.handlers[i].handleSync.apply(this.handlers[i], arguments);
      if (result !== undefined) {
        restore();
        return result;
      }
    }
    restore();
  }
};
