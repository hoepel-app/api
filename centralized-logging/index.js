'use strict';

const co      = require('co');
const Promise = require('bluebird');
const AWS     = require('aws-sdk');

// ============================================
const region = "eu-west-3";
const retentionDays = 7;
const prefix = '/';  // use '/' if you want to process every log group
const enableRetention = false; // false if you want to leave retention as is (none by default)
// ============================================

AWS.config.region = region;
const destFuncArn = `arn:aws:lambda:eu-west-3:148513658395:function:DataDogLogShipper`;
const cloudWatchLogs = new AWS.CloudWatchLogs();
const lambda         = new AWS.Lambda();

let listLogGroups = co.wrap(function* (acc, nextToken) {
  let req = {
    limit: 50,
    logGroupNamePrefix: prefix,
    nextToken: nextToken
  };
  let resp = yield cloudWatchLogs.describeLogGroups(req).promise();

  let newAcc = acc.concat(resp.logGroups.map(x => x.logGroupName));
  if (resp.nextToken) {
    return yield listLogGroups(newAcc, resp.nextToken);
  } else {
    return newAcc;
  }
});

let subscribe = co.wrap(function* (logGroupName) {
  let options = {
    destinationArn : destFuncArn,
    logGroupName   : logGroupName,
    filterName     : 'ship-logs',
    filterPattern  : '[timestamp=*Z, request_id="*-*", event]'
  };

  try {
    yield cloudWatchLogs.putSubscriptionFilter(options).promise();
  } catch (err) {
    console.log(`FAILED TO SUBSCRIBE [${logGroupName}]`);
    console.error(JSON.stringify(err));

    if (err.retryable === true) {
      let retryDelay = err.retryDelay || 1000;
      console.log(`retrying in ${retryDelay}ms`);
      yield Promise.delay(retryDelay);
      yield subscribe(logGroupName);
    }
  }
});

let setRetentionPolicy = co.wrap(function* (logGroupName) {
  let params = {
    logGroupName    : logGroupName,
    retentionInDays : retentionDays
  };

  yield cloudWatchLogs.putRetentionPolicy(params).promise();
});

let processAll = co.wrap(function* () {
  let logGroups = yield listLogGroups([]);
  for (let logGroupName of logGroups) {    
    console.log(`subscribing [${logGroupName}]...`);
    yield subscribe(logGroupName);
    
    if (enableRetention) {
      console.log(`updating retention policy for [${logGroupName}]...`);
      yield setRetentionPolicy(logGroupName);
    }
  }
});

processAll().then(_ => console.log("all done"));
