'use strict';

module.exports = require('serverless.hoepel.app-common/dist/functions/auth');
module.exports.authorizer = require('serverless.hoepel.app-common/dist/authorizers/authorizer').authorizer;
