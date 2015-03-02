/**
 * Created by Lars.
 * This file contains the handling for Neo4j version 2.1.4
 * due to a change in result it is necessary to react on the version of neo4j.
 */
var exporting = function(logger,server) {
    var http = require('http');

    this.query = function (cypher, parameters, expectedStats, callback) {
        // Check the requirements
        if (!callback && parameters && typeof parameters === 'function') {
            // parameters is callback
            callback = parameters;
            parameters = {};
        }

        if (!callback && expectedStats && typeof expectedStats === 'function') {
            // expectedStats is callback
            callback = expectedStats;
            expectedStats = {};
        }

        if (typeof callback !== 'function') {
            callback = function () {
            };
        }

        if (cypher === undefined) {
            var error = new Error('Cypher statement is required');
            error.status = 500;
            callback(error);
            return;
        }

        var options = server.getOptions();
        var path = options.path;


        var body = {
            statements: [
                {
                    statement: cypher,
                    parameters: parameters,
                    resultDataContents: ['REST']
                }
            ]
        };

        //logger.verbose("Cypher statement: " + body.statements[0].statement);

        var request = http.request(options, function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                logger.verbose('Response' + str);
                var response = JSON.parse(str),
                    data = [],
                    result = response.results[0];
                if (response) {
                    if (response.errors[0]) {
                        logger.warn(body);
                        var error = new Error(response.errors[0].message);
                        error.code = response.errors[0].code;
                        error.status = 500;
                        callback(error);
                        return;
                    }
                    if (!result.data) {
                        logger.debug('result has no data');
                        callback();
                        return;
                    }
                    result.data.forEach(function (value) {
                        var newObj = {};
                        value.rest.forEach(function (prop, index) {
                            if (prop == null) {
                                newObj[result.columns[index]] = null;
                            } else if (prop.self && new RegExp('(http:\/\/' + options.host + ':' + options.port + '\/db\/data\/node\/[0-9]*)').test(prop.self)) {
                                // node result
                                newObj[result.columns[index]] = prop.data;
                            } else if (prop.self && new RegExp('(http:\/\/' + options.host + ':' + options.port + '\/db\/data\/relationship\/[0-9]*)').test(prop.self)) {
                                // relationship result
                                newObj[result.columns[index]] = prop.data;
                            } else {
                                newObj[result.columns[index]] = prop;
                            }
                        });
                        data.push(newObj);
                    });
                    logger.debug('result object: ' + JSON.stringify(data));
                    callback(undefined, data);
                } else {
                    logger.warn('Empty result!');
                    var error = new Error('Result was empty: ' + JSON.stringify(body));
                    error.status = 500;
                    logger.warn('error');
                    callback(error);
                }
            });
        });
        request.write(JSON.stringify(body));
        request.end();
        options.path = path;
    }
};
module.exports =  exporting;
