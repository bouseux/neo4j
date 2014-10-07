/**
 * Created by Lars on 04.10.2014.
 */
var server = require('./../lib/server.js');

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
        setInvalidPortNegativ: function (test) {
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
            var object = {
                cypher: 'MATCH N RETURN N'
            };
            var error = server.executeCypher(object);
            if (error) {
                test.fail('Should not have failed');
            }
            test.done();
        },
        setCallbackCypher: function (test) {
            var object = {
                cypher: 'MATCH N DELETE N',
                callback: function () {
                    test.done();
                }
            };
            server.executeCypher(object);
        },
        cypherResponse: {
            setUp: function(callback) {
                var object = {
                    cypher:
                        'CREATE (a:TestNode {prop:\'Value\'}), ' +
                        '       (b:TestNode2 {prop:\'Value1\'}), ' +
                        '       (:TestNode2 {prop:\'Value2\'}),' +
                        '       (a)-[:testRel {propRel:\'ValueR\'}]->(b)',
                    callback: function (err) {
                        if (err) {
                            //TODO: logging
                            return;
                        }
                        callback();
                    }
                };
                server.executeCypher(object);
            },
            tearDown: function(callback) {
                var object = {
                    cypher: 'MATCH (t:TestNode), (t2:TestNode2) OPTIONAL MATCH (t)-[r]->() DELETE r, t, t2',
                    callback: function (err) {
                        if (err) {
                            //TODO: logging
                            return;
                        }
                        callback();
                    }
                };
                server.executeCypher(object);
            },
            nodeResponse: function(test) {
                var object = {
                    cypher: 'MATCH (t:TestNode) RETURN t',
                    callback: function(err, data) {
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
                    }
                };
                server.executeCypher(object);
            },
            tableLineResponse: function(test) {
                var object = {
                    cypher: 'MATCH (t:TestNode) RETURN t.prop as prop',
                    callback: function(err, data) {
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
                    }
                };
                server.executeCypher(object);
            },
            tableLineNodeResponseMix: function(test) {
                var object = {
                    cypher: 'MATCH (t:TestNode) RETURN t, t.prop as prop',
                    callback: function(err, data) {
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
                    }
                };
                server.executeCypher(object);
            },
            collectionResponse: function(test) {
                var object = {
                    cypher: 'MATCH (t:TestNode) RETURN labels(t) as labels',
                    callback: function(err, data) {
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
                    }
                };
                server.executeCypher(object);
            },
            multipleResponseNodes: function(test) {
                var object = {
                    cypher: 'MATCH (t:TestNode2) RETURN t ORDER BY t.prop',
                    callback: function(err, data) {
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
                    }
                };
                server.executeCypher(object);
            },
            relationshipResponse: function(test) {
                var object = {
                    cypher: 'MATCH (t:TestNode)-[r]->(t2) RETURN t, r, type(r) as type, t2',
                    callback: function(err, data) {
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
                    }
                };
                server.executeCypher(object);
            }
        },
        cypherErrors: {
            syntaxError: function(test) {
                var object = {
                    cypher: 'MATCH n DELETE X',
                    callback: function (err) {
                        test.equal(err.type, 'SyntaxException');
                        test.done();
                    }
                };
                server.executeCypher(object);
            }
        }
    }
};
