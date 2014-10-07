/**
 * Created by Lars on 04.10.2014.
 */
var server = require('./../lib/server.js'),
    logger = require('./../lib/logger.js');

module.exports = {
    setOptionsTests: {
        setOptions: function (test) {
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
                returnValue = server.setOptions(options);

            if (returnValue) {
                test.fail("Should not give an response");
            }
            test.done();
        },
        setInvalidPortNegative: function (test) {
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
                returnValue = server.setOptions(options);

            if (!returnValue) {
                test.fail("Should have give an error");
            }
            test.done();
        },
        setInvalidPortToHigh: function (test) {
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
                returnValue = server.setOptions(options);

            if (!returnValue) {
                test.fail("Should have give an error");
            }
            test.done();
        },
        setInvalidNaN: function (test) {
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
                returnValue = server.setOptions(options);

            if (!returnValue) {
                test.fail("Should have give an error");
            }
            test.done();
        },
        setInvalidObject: function (test) {
            var options = {
                    port: 'abc',
                    method: 'POST',
                    path: '/db/data/cypher?includeStats=true',
                    headers: {
                        'Accept': 'application/json; charset=UTF-8',
                        'Content-Type': 'application/json'
                    }
                },
                returnValue = server.setOptions(options);

            if (!returnValue) {
                test.fail("Should have give an error");
            }
            test.done();
        }
    },
    cypherQueryTests: {
        setOnlyCypher: function (test) {
            var cypher = 'MATCH N RETURN N';
            var error = server.query(cypher);
            if (error) {
                test.fail('Should not have failed');
            }
            test.done();
        },
        setCallbackCypher: function (test) {
            var cypher = 'MATCH N DELETE N';
            server.query(cypher, function() {
                    test.done();
                }
            );
        },
        cypherResponse: {
            setUp: function(callback) {
                var cypher =
                    'CREATE (a:TestNode {prop:\'Value\'}), ' +
                    '       (b:TestNode2 {prop:\'Value1\'}), ' +
                    '       (:TestNode2 {prop:\'Value2\'}),' +
                    '       (a)-[:testRel {propRel:\'ValueR\'}]->(b)';
                server.query(cypher, function (err) {
                    if (err) {
                        //TODO: logging
                        return;
                    }
                    callback();
                });
            },
            tearDown: function(callback) {
                var cypher = 'MATCH (t:TestNode), (t2:TestNode2) OPTIONAL MATCH (t)-[r]->() DELETE r, t, t2';
                server.query(cypher,  function (err) {
                    if (err) {
                        //TODO: logging
                        return;
                    }
                    callback();
                });
            },
            nodeResponse: function(test) {
                var cypher = 'MATCH (t:TestNode) RETURN t';
                server.query(cypher, function(err, data) {
                    if (err) {
                        test.fail('No error expected');
                        test.done();
                        return;
                    }
                    var expectedData = [
                        {
                            t: {
                                prop: 'Value'
                            }
                        }
                    ];
                    test.equals(JSON.stringify(data), JSON.stringify(expectedData));
                    test.done();
                });
            },
            tableLineResponse: function(test) {
                var cypher = 'MATCH (t:TestNode) RETURN t.prop as prop';
                server.query(cypher, function(err, data) {
                    if (err) {
                        logger.error(err);
                        test.fail('No error expected');
                        test.done();
                        return;
                    }
                    var expectedData = [
                        {
                            prop: 'Value'
                        }
                    ];
                    test.equals(JSON.stringify(data), JSON.stringify(expectedData));
                    test.done();
                });
            },
            tableLineNodeResponseMix: function(test) {
                var cypher = 'MATCH (t:TestNode) RETURN t, t.prop as prop';
                server.query(cypher, function(err, data) {
                    if (err) {
                        logger.error(err);
                        test.fail('No error expected');
                        test.done();
                        return;
                    }
                    var expectedData = [
                        {
                            t: {
                                prop: 'Value'
                            },
                            prop: 'Value'
                        }
                    ];
                    test.equals(JSON.stringify(data), JSON.stringify(expectedData));
                    test.done();
                });
            },
            collectionResponse: function(test) {
                var cypher = 'MATCH (t:TestNode) RETURN labels(t) as labels';
                server.query(cypher, function(err, data) {
                    if (err) {
                        logger.error(err);
                        test.fail('No error expected');
                        test.done();
                        return;
                    }
                    var expectedData = [
                        {
                            labels: ['TestNode']
                        }
                    ];
                    test.equals(JSON.stringify(data), JSON.stringify(expectedData));
                    test.done();
                });
            },
            multipleResponseNodes: function(test) {
                var cypher = 'MATCH (t:TestNode2) RETURN t ORDER BY t.prop';
                server.query(cypher, function(err, data) {
                    if (err) {
                        test.fail('No error expected' + err);
                        test.done();
                        return;
                    }
                    var expectedData = [
                        {
                            t: {
                                prop: 'Value1'
                            }
                        },
                        {
                            t: {
                                prop: 'Value2'
                            }
                        }
                    ];
                    test.equals(JSON.stringify(data), JSON.stringify(expectedData));
                    test.done();
                });
            },
            relationshipResponse: function(test) {
                var cypher = 'MATCH (t:TestNode)-[r]->(t2) RETURN t, r, type(r) as type, t2';
                server.query(cypher, function(err, data) {
                    if (err) {
                        test.fail('No error expected' + err);
                        test.done();
                        return;
                    }
                    var expectedData = [
                        {
                            t: {
                                prop: 'Value'
                            },
                            r: {
                                propRel: 'ValueR'
                            },
                            type: 'testRel',
                            t2: {
                                prop: 'Value1'
                            }
                        }
                    ];
                    test.equals(JSON.stringify(data), JSON.stringify(expectedData));
                    test.done();
                });
            }
        },
        cypherErrors: {
            syntaxError: function(test) {
                var cypher = 'MATCH n DELETE X';
                server.query(cypher, function (err) {
                    test.equal(err.type, 'SyntaxException');
                    test.done();
                });
            }
        }
    },
    runningTest: {
        checkIfRunning: function(test){
            server.databaseIsRunning(function(running){
                test.equal(running, true);
                test.done();
            });

        }
    }

};
