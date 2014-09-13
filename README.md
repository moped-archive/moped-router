# moped-router

Router for a moped application

[![Build Status](https://img.shields.io/travis/mopedjs/moped-router/master.svg)](https://travis-ci.org/mopedjs/moped-router)
[![Dependency Status](https://img.shields.io/gemnasium/mopedjs/moped-router.svg)](https://gemnasium.com/mopedjs/moped-router)
[![NPM version](https://img.shields.io/npm/v/moped-router.svg)](https://www.npmjs.org/package/moped-router)

## Installation

    npm install moped-router

## Usage

moped-router can be used as a standalone router.  It can handle being given any aribrary Object with a "path" property, which will be treated as the moped request.

cars.js

```js
var MopedRouter = require('moped-router');
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

module.exports = app;
```

index.js

```js
var MopedRouter = require('moped-router');
var app = new MopedRouter();

app.use('/cars', require('./cars.js'));

var req = {path: '/cars/volvo'};

app.handleAsync(req).then(function (res) {
  // res was asynchronously determined, using all handlers
  assert.deepEqual(JSON.parse(res), {_id: 'volvo'});
  // we can also re-run all the synchronous handlers immediately
  // note that we re-use the request so that the database call
  // doesn't need to be made again
  var res2 = app.handleSync(req);
  assert.deepEqual(JSON.parse(res2), {_id: 'volvo'});
});

// handling post always returns a promise.  You are expected to provide the extra `body` property
// which represents the arguments to the post.
app.handlePost({path: '/cars/write-car'}, 'honda', {}).then(function (res) {
  assert(res.ok === 1);
});
```

## API

### app.use(path?, subapp)

`app.use` lets you mount sub-applications.  You may provide an optional base-path for the sub-application (which defaults to `/`).  This path is a string, and does not get pattern matching like other paths.

You can detect when a subapp is mounted by calling:

```js
subapp.onMount(function (basepath, parent) {
  console.log('mounted at ' + basepath);
  assert(basepath === subapp.basepath);
  assert(parent === subapp.parent);
});
```

### app.init(path?, handler)

Register a handler that is only triggerd on the first page load.  You can use these to initialize any state that is needed for the application to run.  Note that in moped these are called for every server request and just the first client request.

The init handlers can return Promises, if they need to load data asynchronously.

### app.navigate(path?, handler)

Register a handler that is called every time navigation occurs.  You can use these to load additional data that may be required to render a new page.

The navigate handlers can return Promises, if they need to load data asynchronously.

### app.render(path?, handler)

Register a handler that is called for every render.  These must be synchronous, so any asynchronous work must be done in navigate or init handlers.  If they were allowed to be asynchronous, you would not be able to use them propery to re-render react views.

### app.onPost(path?, handler)

Register a handler to be called on post requests.  These are useful for updates.  In moped, a `.post` api is added on both client and server that can be used as a system of remote procedure calls.

### app.handleInit(request, ...)

Handle the initial request (note that any additional arguments are also passed to handlers).  This returns a promise for the result of calling each handler until one of them returns something other than undefined.

### app.handleNavigate(request, ...)

Handle a request as a result of client side navigation (note that any additional arguments are also passed to handlers).  This returns a promise for the result of calling each handler until one of them returns something other than undefined.

### app.handleRender(request, ...)

Handle a render that is not the result of a navigation (note that any additional arguments are also passed to handlers).  This returns the result of calling each handler until one of them returns something other than undefined.

### app.handlePost(request, ...)

Handle an incomming post request on the server side.

## Moped Extensions / Changes

Moped provides a `.run` method that behaves differently depending on whether it is on the client or the server.  It also overrides `.post` on the client so that it actually does the `.post` to the server and `.post` on the server so that it just makes an internal request.

## License

  MIT
