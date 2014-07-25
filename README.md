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

### app.async(path?, handler) / app.first(path?, handler)

Registers an asynchronous handler (i.e. one that may return a promise).  This is only run when making "asynchronous" requests.  You can use these to initialize any state that is needed for the application to run.  Note that in moped these are called for every server request and just the first client request.

This has two aliases that do the same thing, to help you express intent.

### app.get(path?, handler) / app.sync(path?, handler) / app.every(path?, handler)

Registers a synchronous handler.  This is where the bulk of your application happens.  These are run on every request, and are only allowed to be synchronous (to ensure react can re-render the view synchronously).

This has three aliases that do the same thing, to help you express intent.

### app.post(path? handler)

Registers a "post" handler.  This is just like `app.async` except that it is called by `app.handlePost(req, ...)`

### app.handleAsync(request, ...)

Handle an asychronous request (note that any additional arguments are also passed to handlers).  This returns a promise for the result of calling each handler until one of them returns something other than undefined.

### app.handleSync(request, ...)

Handle a sychronous request (note that any additional arguments are also passed to handlers).  This returns the result of calling each handler until one of them returns something other than undefined.

### app.handlePost(request, ...)

Handles a post request (asynchronously).  This is just like `app.handleAsync(request, ...)` except that it uses the `post` handlers.

## Moped Extensions / Changes

Moped provides a `.run` method that behaves differently depending on whether it is on the client or the server.  It also overrides `.post` on the client so that it actually does the `.post` to the server.

## License

  MIT
