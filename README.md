# moped-router

Router for a moped application

[![Build Status](https://img.shields.io/travis/mopedjs/moped-router/master.svg)](https://travis-ci.org/mopedjs/moped-router)
[![Dependency Status](https://img.shields.io/david/mopedjs/moped-router.svg)](https://david-dm.org/mopedjs/moped-router)
[![NPM version](https://img.shields.io/npm/v/moped-router.svg)](https://www.npmjs.org/package/moped-router)

## Installation

    npm install moped-router

## Usage

moped-router can be used as a standalone router.  It can handle being given any aribrary Object with a "path" property, which will be treated as the moped request.

cars.js

```js
var MopedRouter = require('moped-router');
var app = new MopedRouter();

app.get('/user/:id', function (req) {
  return db.users.find({_id: req.params.id});
});

var carApp = new MopedRouter();
var cars = {
  volvo: {color: 'red', size: 'big'},
  bmw: {color: 'black', size: 'small'}
};
carApp.get('/color', function (req) {
  return cars[req.params.car].color;
});
carApp.get('/size', function (req) {
  return cars[req.params.car].size;
});
app.use('/car/:car', carApp);

app.handle({method: 'get', path: '/car/volvo/color'}).then(function (res) {
  assert(res == 'red');
});

module.exports = app;
```

## API

### app.use(path?, subapp)

`app.use` lets you mount sub-applications.  You may provide an optional base-path for the sub-application (which defaults to `/`).  This path is a string, and does not get pattern matching like other paths.

### app.METHOD(path, handlers...)

Register a handler that is called for each request that has the given `METHOD` and `path` (using express style path matching).  These can be made asynchronous by returning promises.

### app.all(path, handlers...)

Just like `app.METHOD(path, handlers...)` except for it targets every method.

### app.handle(request, ...)

Handle a request and get a promise for the results

## Moped Extensions / Changes

Moped provides a `.run` method that behaves differently depending on whether it is on the client or the server.  It also passes in `req` and `res` with some helpful methods and properties.

## License

  MIT
