'use strict';

var assert = require('assert');
var app = require('./example');

var req = {path: '/cars/volvo'};

app.handleInit(req).done(function (res) {
  // res was asynchronously determined, using all handlers
  assert.deepEqual(JSON.parse(res), {_id: 'volvo', description: 'dull'});
  req.path = '/cars/ferrari';
  app.handleNavigate(req).done(function (res) {
    // res was asynchronously determined, using just navigation handlers
    assert.deepEqual(JSON.parse(res), {_id: 'ferrari', description: 'exciting'});
    // we can also re-run all the synchronous handlers immediately
    // note that we re-use the request so that the database call
    // doesn't need to be made again
    var res2 = app.handleRender(req);
    assert.deepEqual(JSON.parse(res2), {_id: 'ferrari', description: 'exciting'});
  });
});

// handling post always returns a promise.  You are expected to provide the extra `body` property
// which represents the arguments to the post.
app.handlePost({path: '/cars/write-car'}, 'honda', {}).done(function (res) {
  assert(res.ok === 1);
});
