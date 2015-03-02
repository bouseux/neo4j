/**
 *
 * @param {object} options define the connection options
 */
var neo4j = function(options) {
    var http = require('http'),
        logger = require('./logger.js'),
        self = this,
        version = undefined,
        isOnline = false;


    var v2_1_4 =new(require('./v2_1_4.js'))(logger,self),
        v2_1_7 =new(require('./v2_1_7.js'))(logger,self);



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
                    self.version = obj.neo4j_version;
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
    this.databaseIsRunning(function(isRunning){
        isOnline = isRunning;
    })


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
        if (self.version !== undefined) {
            return self.version;

        } else {
            setTimeout(function () {
                return (self.getVersion());
            }, 10);
        }
    }


    //Set the correct handling for cypher:

    /**
     *
     * @param {String} cypher
     * @param {(String|Function)=} parameters (optional)
     * @param {(String|Function)=} expectedStats (optional)
     * @param {Function=} callback (optional)
     */
    this.query = function (cypher, parameters, expectedStats, callback) {
        // Check the param with the callback.
        if(!isOnline){
            setTimeout(function () {
                (self.query(cypher, parameters, expectedStats, callback));
            }, 10);
            return;
        }

        if (!callback && expectedStats && typeof expectedStats === 'function') {
            // expectedStats is callback
            callback = expectedStats;
            expectedStats = {};
        }

        if (!callback && parameters && typeof parameters === 'function') {
            // parameters is callback
            callback = parameters;
            parameters = {};
        }

        if (typeof callback !== 'function') {
            callback = function () {
            };
        }

        if(self.version=== undefined){
            self.version = self.getVersion();
        }
        //version 2.0.4 and 2.1.4 have the same api.
        if(self.version === '2.1.4'|| self.version === '2.0.4') {
            //version 2.0.4 and 2.1.4 have the same api.
            v2_1_4.query(cypher, parameters, expectedStats, callback);
        }else if (self.version === '2.1.7'){
            v2_1_7.query(cypher,parameters,expectedStats,callback);
        }else{
            var error = new Error('The version ' + self.version + ' of neo4j is not yet supported');
            error.status = 500;
            callback(error);
        }
    }

};

module.exports = neo4j;
