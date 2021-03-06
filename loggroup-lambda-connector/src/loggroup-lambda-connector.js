var AWS = require("aws-sdk");

var cwl = new AWS.CloudWatchLogs({apiVersion: '2014-03-28'});

function subscribeToLambda(lambdaLogGroupName, lambdaArn, errorHandler) {
    var params = {
        destinationArn: lambdaArn,
        filterName: 'SumoLGLBDFilter',
        filterPattern: '',
        logGroupName: lambdaLogGroupName
    };
    // handle case where subscription filter exists/case where loggroup generated by target lambda
    cwl.putSubscriptionFilter(params, errorHandler);
}

function filterLogGroups(event, logGroupRegex) {
    logGroupRegex = new RegExp(logGroupRegex, "i");
    var logGroupName = event.detail.requestParameters.logGroupName;
    if (logGroupName.match(logGroupRegex) && event.detail.eventName === "CreateLogGroup") {
        return true;
    } else {
        return false;
    }
}

function subscribeExistingLogGroups(logGroups) {
    var logGroupName;
    var logGroupRegex = new RegExp(process.env.LOG_GROUP_PATTERN, "i");
    var lambdaArn = process.env.LAMBDA_ARN;
    for (var i = logGroups.length - 1; i >= 0; i--) {
        logGroupName = logGroups[i].logGroupName;
        if (logGroupName.match(logGroupRegex)) {
            subscribeToLambda(logGroupName, lambdaArn, (function(inner_logGroupName) { return function (err, data) {
                if (err) {
                    console.log("Error in subscribing", inner_logGroupName, err);
                } else {
                    console.log("Successfully subscribed logGroup: ", inner_logGroupName);
                }
            };})(logGroupName));
        } else {
            console.log("Unmatched logGroup: ", logGroupName);
        }
    }
}

function processExistingLogGroups(token, errorHandler) {

    var params = {
      limit: 50,
      // logGroupNamePrefix: 'STRING_VALUE',
      nextToken: token
    };
    var p = new Promise(function(resolve, reject) {
        cwl.describeLogGroups(params, function(err, data) {
            if (err) {
                console.log("error in fetching logGroups", err, err.stack);
                reject(err);
            } else {
                console.log("fetched logGroups: " + data.logGroups.length + " nextToken: " + data.nextToken);
                resolve(data);
            }
        });
    });
    var cb = function (data) {
        subscribeExistingLogGroups(data.logGroups);
        if (data.nextToken) {// if next set of log groups exists
            processExistingLogGroups(data.nextToken, errorHandler)
        } else {
            errorHandler(null, "Success");
        }
    };
    return p.then(cb).catch(function (err) {
        errorHandler(err, "Error in fetching logGroups");
    });
}

function processEvents(env, event, errorHandler) {

    var logGroupName = event.detail.requestParameters.logGroupName;
    if (filterLogGroups(event, env.LOG_GROUP_PATTERN)) {
        console.log("Subscribing: ", logGroupName, env.LAMBDA_ARN);
        subscribeToLambda(logGroupName, env.LAMBDA_ARN, errorHandler);
    } else {
        console.log("Unsubscribed: ", logGroupName, env.LAMBDA_ARN);
    }

}

exports.handler = function (event, context, callback) {
    function errorHandler(err, msg) {
        if (err) {
            console.log(err, msg);
            callback(err);
        } else {
            callback(null, "Success");
        }
    }
    if (process.env.USE_EXISTING_LOG_GROUPS == "true") {
        processExistingLogGroups(null, errorHandler);
    } else {
        processEvents(process.env, event, errorHandler);
    }

};
