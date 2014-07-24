'use strict';

var MopedRouter = require('../../');
var app = new MopedRouter();

app.use('/cars', require('./cars.js'));

module.exports = app;
