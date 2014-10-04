/**
 * Created by Lars on 04.10.2014.
 */
var http = require('http'),
    logger = require('./logger.js'),
    options = {
        host: 'localhost',
        port: '7474',
        method: 'POST',
        path: '/db/data/cypher?includeStats=true',
        headers: {
            'Accept': 'application/json; charset=UTF-8',
            'Content-Type': 'application/json'
        }
    };
/**
 * Setting the options for the connection.
 * @param options{
 *              host,
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
module.exports.setOptions = function(options){
    var requiredOptions = ['host', 'port', 'method', 'path', 'headers'],
        fields = Object.keys(options),
        errorFields = [];

    for(var field in fields){
        var fieldName = fields[field],
            fieldValue = options[fieldName];

        if(fieldName === 'port' && (isNaN(parseInt(fieldValue))|| parseInt(fieldValue) < 0 || parseInt(fieldValue) > 65536)){
            errorFields.push(fieldName);
        }

        if (requiredOptions.indexOf(fieldName) === -1){
            errorFields.push(fieldName);
        }
    }
    if(errorFields.length !== 0){
        return new Error(errorFields);
    }
};

