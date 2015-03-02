/**
 *
 * @param {object} options define the connection options
 */
var neo4j = function(options) {
    var http = require('http'),
        logger = require('./logger.js'),
        version = undefined,
        self = this;

    var v2_1_4 =new(require('./v2_1_4.js'))(logger,self);



    /**
     * Setting the options for the connection.
     * @param {object} optionsNew my contain a host and/or a port property
     * @return {Error} if options field is not valid,
     *      an error object will be returned
     */
    var setOptions = function(optionsNew) {
        var requiredOptions = ['host', 'port', 'method', 'path', 'headers'],
            fields = Object.keys(optionsNew),
            errorFields = [];

        for (var field in fields) {
            var fieldName = fields[field],
                fieldValue = optionsNew[fieldName];

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
            throw new Error(errorFields);
        }
        logger.verbose('Setting options:' + JSON.stringify(optionsNew));
        options = optionsNew;
    };

    setOptions(options);


    /**
     *
     * @param {String} cypher
     * @param {(String|Function)=} parameters (optional)
     * @param {(String|Function)=} expectedStats (optional)
     * @param {Function=} callback (optional)
     */
    /*     this.query = function(cypher, parameters, expectedStats, callback) {
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

        var request = http.request(options, function(response) {
            var str = '';
            response.on('data', function(chunk) {
                str += chunk;
            });
            response.on('end', function() {
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
                    result.data.forEach(function(value) {
                        var newObj = {};
                        value.rest.forEach(function(prop, index) {
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
                    var error = new Error ('Result was empty: ' + JSON.stringify(body));
                    error.status = 500;
                    logger.warn('error');
                    callback(error);
                }
            });
        });
        request.write(JSON.stringify(body));
        request.end();
        options.path = path;
    };
     */
    /**
     * Checks if Database is running
     * @param {function} callback (function) is called with (true|false) if the server is running
     */
    this.databaseIsRunning = function(callback) {
        var runningTestOption = {
                host: options.host,
                port: options.port,
                method: 'GET',
                path: '/db/data/',
                headers: {
                    'Content-Type': 'text/html'
                }
            },

            request = http.request(runningTestOption, function (res) {
                var output = '';
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    output += chunk;
                });

                res.on('end', function () {
                    var obj = JSON.parse(output);
                    logger.info('Neo4j version:' + obj.neo4j_version);
                    version = obj.neo4j_version;
                    if (res.statusCode === 200) {
                        logger.info('The Neo4J server is running.');
                        callback(true);
                    } else {
                        logger.info('The Neo4J server is not running.');
                        callback(false);
                    }

                });
            });
        request.end();
        request.on('error', function(err) {
            callback(false);
        });
    };


    /**
     * Return the current server configuration
     *
     * @return current server config: {{host: string, port: string, method: string, path: string, headers: {Accept: string, Content-Type: string}}}
     */
    this.getOptions = function() {
        return options;
    };
    /**
     * Return the current neo4j version
     * @returns {String} version of the Server
     */

    this.getVersion = function () {
        if (version !== undefined) {
            return version;
        } else {
            this.databaseIsRunning(function () {
            })
            setTimeout(function () {
                self.getVersion();
            }, 10);
        }
    }
    //Set the correct handling for cypher:


    this.query = function (cypher, parameters, expectedStats, callback) {
        if(version=== undefined){
            version = self.getVersion();
        }
        if(version === '2.1.4'){
            v2_1_4.query(cypher,parameters,expectedStats,callback);
        }
    }

};

module.exports = neo4j;
