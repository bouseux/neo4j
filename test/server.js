/**
 * Created by Lars on 04.10.2014.
 */
var server = require('./../lib/server.js');

module.exports = {
    setOptions : function(test){
        var options = {
            host: 'localhost',
            port: '7474',
            method: 'POST',
            path: '/db/data/cypher?includeStats=true',
            headers: {
                'Accept': 'application/json; charset=UTF-8',
                'Content-Type': 'application/json'
                }
            },
            returnValue =server.setOptions(options);

        if(returnValue){
            test.fail("Should not give an response");
        }
        test.done();
    },
    setInvalidPortNegativ : function(test){
        var options = {
                host: 'localhost',
                port: '-1',
                method: 'POST',
                path: '/db/data/cypher?includeStats=true',
                headers: {
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json'
                }
            },
            returnValue =server.setOptions(options);

        if(! returnValue){
            test.fail("Should have give an error");
        }
        test.done();
    },
    setInvalidPortToHigh : function(test){
        var options = {
                host: 'localhost',
                port: '666666',
                method: 'POST',
                path: '/db/data/cypher?includeStats=true',
                headers: {
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json'
                }
            },
            returnValue =server.setOptions(options);

        if(! returnValue){
            test.fail("Should have give an error");
        }
        test.done();
    },
    setInvalidNaN : function(test){
        var options = {
                host: 'localhost',
                port: 'abc',
                method: 'POST',
                path: '/db/data/cypher?includeStats=true',
                headers: {
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json'
                }
            },
            returnValue =server.setOptions(options);

        if(! returnValue){
            test.fail("Should have give an error");
        }
        test.done();
    },
    setInvalidObject : function(test){
        var options = {
                port: 'abc',
                method: 'POST',
                path: '/db/data/cypher?includeStats=true',
                headers: {
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json'
                }
            },
            returnValue =server.setOptions(options);

        if(! returnValue){
            test.fail("Should have give an error");
        }
        test.done();
    },
    setOnlyCypher: function(test){
        var object = {
            cypher : 'MATCH N RETURN N'
        }
        var error = server.executeCypher(object);
        if (error){
            test.fail('Should not have failed');
        }
        test.done();
    },
    setCallbackCypher: function(test){
        var object = {
            cypher : 'MATCH N DELETE N',
            callback : function(){
                test.done();
            }
        }
        server.executeCypher(object);

    }
}