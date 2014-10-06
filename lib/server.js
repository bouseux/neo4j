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
 * @param options {
 *              'host',
 *              port,
 *              method,
 *              path,
 *              headers : {
 *                  Accept,
 *                  Content-Type
 *                  }
 *              }
 *              This is an expected object.
 */
module.exports.setOptions = function (options) {
    var requiredOptions = ['host', 'port', 'method', 'path', 'headers'],
        fields = Object.keys(options),
        errorFields = [];

    for (var field in fields) {
        var fieldName = fields[field],
            fieldValue = options[fieldName];

        if (fieldName === 'port' && (isNaN(parseInt(fieldValue)) || parseInt(fieldValue) < 0 || parseInt(fieldValue) > 65536)) {
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
    logger.verbose("Setting options:" + JSON.stringify(options))
};

/**
 *
 * @param {object} expects an JSON with at least {cypher='AnyCypher'}
 *          other possible options: {cypher= '', parameters = '',expectedStats = Object, callback = function}
 */
module.exports.executeCypher = function (object) {
    var path = options.path;
    if(object.cypher === undefined){
       return new Error('Field not filled but required:' + Array.toString(requiredFields));
    }
    if(object.callback === undefined){
        logger.warn('No Callback specified, using empty callback function');
        object.callback = function (){};
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
                    object.callback(new Error(response.message));
                }
                var err = checkStats(response.stats, object.expectedStats);
                if (err) {
                    logger.warn(err);
                    object.callback(err);
                }
                if (!response.data) {
                    logger.debug('Response has no data');
                    object.callback();
                }
                response.data.forEach(function(value) {
                    var newObj = {};
                    value.forEach(function(prop, index) {
                        newObj[response.columns[index]] = prop;
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

var checkStats = function(stats, expected) {}


