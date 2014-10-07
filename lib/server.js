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
 * @param {object} object expects an JSON with at least {cypher='AnyCypher'}
 *          other possible options:
 *              {
 *                  cypher= '',
 *                  parameters = '',
 *                  expectedStats = Object,
 *                  callback = function
*               }
 */
module.exports.executeCypher = function(object) {
    var path = options.path;
    if (object.callback === undefined) {
        logger.warn('No Callback specified, using empty callback function');
        object.callback = function() {};
    }
    if (object.cypher === undefined) {
       object.callback(
           new Error('Field not filled but required:' +
                Array.toString(requiredFields)));
    }
    object.parameters = object.parameters || {};
    object.expectedStats = object.expectedStats || {};

    var body = {
        query: object.cypher,
        params: object.parameters
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
                    object.callback(error);
                    return;
                }
                var err = checkStats(response.stats, object.expectedStats);
                if (err) {
                    logger.warn(err);
                    object.callback(err);
                    return;
                }
                if (!response.data) {
                    logger.debug('Response has no data');
                    object.callback();
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
                object.callback(null, data);
            } else {
                logger.warn('Empty response!');
                object.callback(new Error('Response was empty: ' +
                    JSON.stringify(body)));
            }
        });
    });
    request.write(JSON.stringify(body));
    request.end();
    options.path = path;
};

/**
 * Checks if the Neo4J database is running
 * @param callback (function) is called with true|false if the server is running
 */
module.exports.databaseIsRunning = function(callback) {
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

        if(response.statusCode=== 200){
            logger.info('Server is running');
            callback(true);
        }else{
            logger.warn('Server is not running');
            callback(false);
        }

    });
    request.on('error', function(err){
        logger.warn('Database is offline');
        callback(false);
    });
    request.end();
};

var checkStats = function(stats, expected) {};
