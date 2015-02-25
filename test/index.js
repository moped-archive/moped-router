'use strict';

var assert = require('assert');
var Promise = require('promise');
var MopedRouter = require('../');

function rejected(val, Instance, message) {
  var err = new Error('Expected value to be rejected');
  return val.then(function () {
    throw err;
  }, function (err) {
    assert(err instanceof Instance);
    assert(err.message = message);
  });
}
assert.throws(function () {
  MopedRouter();
}, TypeError, 'MopedRouter must be called as a constructor');

var app = new MopedRouter();

assert.throws(function () {
  app.get();
}, TypeError, 'Expected the path to be a string but got undefined');

assert.throws(function () {
  app.get('/');
}, TypeError, 'Expected at least one handler');
assert.throws(function () {
  app.get('/', 10);
}, TypeError, 'Expected the handlers to be functions but got number');

app.get('/', function (req, res) {
  return 'foo';
});

var emptyApp = new MopedRouter();
var fooApp = new MopedRouter();
fooApp.get('/foo', function (req) {
  return 'foo-route';
});

app.use(emptyApp);
app.use(fooApp);

assert.throws(function () {
  app.use();
}, TypeError, 'Expected the path to be a string but got undefined in MopedRouter.use');
assert.throws(function () {
  app.use('/', {});
}, TypeError, 'child to mount must be a moped-router in MopedRouter.use');

var barApp = new MopedRouter();
barApp.get('/bar/:bar', function (req) {
  return req.params.part + '/' + req.params.bar;
});
barApp.get('/bar/:bar/with-url', function (req) {
  return req.url;
});
app.use('/part/:part/', barApp);

assert.throws(function () {
  app.use(fooApp);
}, Error, 'Cannot mount the same app a second time.');

app.post('*', function (req) {
  return 'POST: ' + req.path;
});

app.get('/get-async', function (req) {
  return Promise.resolve('foo');
});
app.put('/error-sync', function (req) {
  throw new Error('sync-error');
});
app.put('/error-async', function (req) {
  return Promise.reject(new Error('async-error'));
});

app.all('*', function (req) {
  return 404;
});

rejected(
  app.handle({}),
  TypeError,
  'req.method must be a string for moped-router to work'
).then(function () {
  return rejected(
    app.handle({method: 'puttle'}),
    TypeError,
    'req.method must be a supported method for moped-router to work'
  )
}).then(function () {
  return rejected(
    app.handle({method: 'get'}),
    TypeError,
    'req.path must be a string for moped-router to work'
  )
}).then(function () {
  return rejected(
    app.handle({method: 'get', path: '/foo', url: true}),
    TypeError,
    'req.url must be a string if present'
  )
}).then(function () {
  return rejected(
    app.handle({method: 'get', path: '/foo', url: '/bar'}),
    TypeError,
    'req.url must start with req.path if present'
  )
}).then(function () {
  return rejected(
    app.handle({method: 'put', path: '/error-sync'}),
    Error,
    'sync-error'
  )
}).then(function () {
  return rejected(
    app.handle({method: 'put', path: '/error-async'}),
    Error,
    'async-error'
  )
}).then(function () {
  return app.handle({method: 'get', path: '/'});
}).then(function (res) {
  assert(res === 'foo');
  return app.handle({method: 'get', path: '/get-async'});
}).then(function (res) {
  assert(res === 'foo');
  return app.handle({method: 'get', path: '/foo'});
}).then(function (res) {
  assert(res === 'foo-route');
  return app.handle({method: 'post', path: '/whatever'});
}).then(function (res) {
  assert(res === 'POST: /whatever');
  return app.handle({method: 'get', path: '/part/10/bar/32'});
}).then(function (res) {
  assert(res === '10/32');
  return app.handle({
    method: 'get',
    path: '/part/10/bar/32/with-url',
    url: '/part/10/bar/32/with-url?foo=bar'
  });
}).then(function (res) {
  assert(res === '/bar/32/with-url?foo=bar');
  return app.handle({method: 'put', path: '/blah/blah'});
}).then(function (res) {
  assert(res === 404);
}).done();
