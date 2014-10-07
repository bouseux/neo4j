/**
 * Created by Lars on 04.10.2014.
 */
var http = require('http'),
    logger = require('./logger.js'),
    options = {
        host: 'localhost',
        port: '7474',
        method: 'POST',
        path: '/db/data/cypher?includeStats=false',
        headers: {
            'Accept': 'application/json; charset=UTF-8',
            'Content-Type': 'application/json'
        }
    };
/**
 * Setting the options for the connection.
 * @param {object} options my contain a host and/or a port property
 * @return {Error} if options field is not valid,
 *      an error object will be returned
 */
module.exports.setOptions = function(options) {
    var requiredOptions = ['host', 'port', 'method', 'path', 'headers'],
        fields = Object.keys(options),
        errorFields = [];

    for (var field in fields) {
        var fieldName = fields[field],
            fieldValue = options[fieldName];

        if (fieldName === 'port' &&
                (isNaN(parseInt(fieldValue)) ||
                    parseInt(fieldValue) < 0 ||
                    parseInt(fieldValue) > 65536)
            ) {
            errorFields.push(fieldName);
        }

        if (requiredOptions.indexOf(fieldName) === -1) {
            errorFields.push(fieldName);
        } else {
            requiredOptions.splice(requiredOptions.indexOf(fieldName), 1);
        }

    }
    for (var i = 0; i < requiredOptions.length; i++) {
        errorFields.push(requiredOptions[i]);
    }
    if (errorFields.length !== 0) {
        return new Error(errorFields);
    }
    logger.verbose('Setting options:' + JSON.stringify(options));
};

/**
 *
 * @param {String} cypher
 * @param {String|Function} parameters (optional)
 * @param {String|Function} expectedStats (optional)
 * @param {Function} callback (optional)
 */
module.exports.executeCypher = function(cypher, parameters, expectedStats, callback) {
    var path = options.path;

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
        callback = function () {};
    }

    if (cypher === undefined) {
       callback(
           new Error('Cypher statement is required'));
    }

    var body = {
        query: cypher,
        params: parameters
    };

    var request = http.request(options, function(response) {
        var str = '';
        response.on('data', function(chunk) {
            str += chunk;
        });
        response.on('end', function() {
            logger.verbose('Response' + str);
            var response = JSON.parse(str),
                data = [];
            if (response) {
                if (response.exception) {
                    logger.warn(body);
                    var error = new Error(response.message);
                    error.type = response.exception;
                    callback(error);
                    return;
                }
                var err = checkStats(response.stats, expectedStats);
                if (err) {
                    logger.warn(err);
                    callback(err);
                    return;
                }
                if (!response.data) {
                    logger.debug('Response has no data');
                    callback();
                    return;
                }
                response.data.forEach(function(value) {
                    var newObj = {};
                    value.forEach(function(prop, index) {
                        if (prop.self && new RegExp('(http:\/\/' + options.host + ':' + options.port + '\/db\/data\/node\/[0-9]*)').test(prop.self)) {
                            // node response
                            newObj[response.columns[index]] = prop.data;
                        } else if (prop.self && new RegExp('(http:\/\/' + options.host + ':' + options.port + '\/db\/data\/relationship\/[0-9]*)').test(prop.self)) {
                            // relationship response
                            newObj[response.columns[index]] = prop.data;
                        } else {
                            newObj[response.columns[index]] = prop;
                        }
                    });
                    data.push(newObj);
                });
                logger.debug('Response object: ' + JSON.stringify(data));
                callback(null, data);
            } else {
                logger.warn('Empty response!');
                callback(new Error('Response was empty: ' +
                    JSON.stringify(body)));
            }
        });
    });
    request.write(JSON.stringify(body));
    request.end();
    options.path = path;
};

/**
 * Checks if server is running
 * // TODO: add callback
 */
module.exports.databaseIsRunning = function() {
    var runningTestOption = {
            host: 'localhost',
            port: '7474',
            method: 'GET',
            path: '/db/data/',
            headers: {
                'Content-Type': 'text/html'
        }
    },
    request = http.request(runningTestOption, function(response) {
        response.on('end', function() {
            //TODO: check if 200 or 404
            //If 200:return true, else false.
        });
    });
    request.end();
};

var checkStats = function(stats, expected) {};
