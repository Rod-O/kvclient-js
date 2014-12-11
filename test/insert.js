/*-
 *
 *  This file is part of Oracle NoSQL Database
 *  Copyright (C) 2011, 2014 Oracle and/or its affiliates.  All rights reserved.
 *
 * If you have received this file as part of Oracle NoSQL Database the
 * following applies to the work as a whole:
 *
 *   Oracle NoSQL Database server software is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU Affero
 *   General Public License as published by the Free Software Foundation,
 *   version 3.
 *
 *   Oracle NoSQL Database is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *   Affero General Public License for more details.
 *
 * If you have received this file as part of Oracle NoSQL Database Client or
 * distributed separately the following applies:
 *
 *   Oracle NoSQL Database client software is free software: you can
 *   redistribute it and/or modify it under the terms of the Apache License
 *   as published by the Apache Software Foundation, version 2.0.
 *
 * You should have received a copy of the GNU Affero General Public License
 * and/or the Apache License in the LICENSE file along with Oracle NoSQL
 * Database client or server distribution.  If not, see
 * <http://www.gnu.org/licenses/>
 * or
 * <http://www.apache.org/licenses/LICENSE-2.0>.
 *
 * An active Oracle commercial licensing agreement for this product supersedes
 * these licenses and in such case the license notices, but not the copyright
 * notice, may be removed by you in connection with your distribution that is
 * in accordance with the commercial licensing terms.
 *
 * For more information please contact:
 *
 * berkeleydb-info_us@oracle.com
 *
 */
"use strict";

var fs = require("fs");
var assert = require("assert");
var Int64 = require('node-int64');
var kvClient = require("../kvclient");
var kvTypes = kvClient.Types;
var kvErrors = kvClient.Errors;
var ttypes = require("../lib/thrift/ondb_types.js");

describe("KVClient", function () {

    var file64 = new Buffer(fs.readFileSync(__dirname + "/image.jpg")).toString("base64");
    var fbin64 = new Buffer("1234567890").toString("base64");
    var configuration = new kvClient.Configuration();
    configuration.proxyConfiguration = kvClient.Proxy.readProxyConfiguration(__dirname + "/test-conf.json");

    this.timeout(5000);

    function Row() {
        this.id = 100;
        this.s = "String value";
        this.l = new Int64("DE0B6B3A763FFFF");  // using Int64 for big numbers
        this.f = 9.123456;         //float
        this.d = 9.12345678901234; //double
        this.bool = true;
        //this.bin = file64;
        //this.fbin = fbin64;
        this.arrStr = ["X", "Y", "Z"];
        this.e = "A";
    }

    var durability =
        new kvTypes.Durability(kvTypes.SyncPolicy.SYNC,
            kvTypes.ReplicaAckPolicy.ALL,
            kvTypes.SyncPolicy.SYNC);

    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);

    var row = new Row();

        describe("Put*", function () {

            var store = kvClient.createStore(configuration);

            before(function (done) {
                store.open(done);
            });
            this.timeout(50000); // debugging

            describe("Put", function () {

                it("Should do a simple Put", function (done) {
                    store.put("t2", row, writeOptions, done);
                });

                it("Should throw error sending long on int field", function (done) {
                    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    var row = new Row();
                    row.id = 2147483648;
                    store.put("t2", row, writeOptions, function (err, result) {
                        kvErrors.assertTError(err, kvErrors.TIllegalArgumentException, "Expected TIllegalArgumentException");
                        done();
                    });
                });

                it("Should throw error sending bigint on long field", function (done) {
                    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    var row = new Row();
                    row.l = 9223372036854775808;
                    store.put("t2", row, writeOptions, function (err, result) {
                        kvErrors.assertTError(err, kvErrors.TIllegalArgumentException, "Expected TIllegalArgumentException");
                        done();
                    });
                });

                it("Should throw error sending string on array field", function (done) {
                    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    var row = new Row();
                    row.arrStr = "hello";
                    store.put("t2", row, writeOptions, function (err, result) {
                        kvErrors.assertTError(err, kvErrors.TIllegalArgumentException, "Expected TIllegalArgumentException");
                        done();
                    });
                });

                it("Should put with default Durability", function (done) {
                    var writeOptions = new kvTypes.WriteOptions();
                    writeOptions.returnChoice = kvTypes.ReturnChoice.ALL;
                    writeOptions.timeout = 100;
                    store.put("t2", row, writeOptions, done);

                });

                it("Will throw error with an empty Put", function (done) {
                    var writeOptions = new kvTypes.WriteOptions();
                    writeOptions.returnChoice = kvTypes.ReturnChoice.ALL;
                    writeOptions.timeout = 100;
                    var row = null;
                    store.put("t2", row, writeOptions, function (err) {
                        done(assert.throws(err, function () {
                                if ((err instanceof Error) && err.message) {
                                    return true;
                                }
                            }
                        ));
                    });
                })

                it("Will Put with all WriteOptions (108 combinations)", function (done) {
                    var putCount = 0, backCount = 0;
                    var errorFlag = false;
                    util.print("          WriteOptions tests: ");
                    for (var masterSync_KEY in kvTypes.SyncPolicy) {
                        for (var replicaAck_KEY in kvTypes.ReplicaAckPolicy) {
                            for (var replicaSync_KEY in kvTypes.SyncPolicy) {
                                var iDurability =
                                    new kvTypes.Durability(
                                        kvTypes.SyncPolicy[masterSync_KEY],
                                        kvTypes.ReplicaAckPolicy[replicaAck_KEY],
                                        kvTypes.SyncPolicy[replicaSync_KEY]);
                                for (var ReturnChoice_KEY in kvTypes.ReturnChoice) {
                                    var writeOptions =
                                        new kvTypes.WriteOptions(iDurability, kvTypes.ReturnChoice[ReturnChoice_KEY], 1000);
                                    row.id = putCount++;
                                    store.put("t2", row, writeOptions, function (err, response) {
                                        if (!errorFlag) {
                                            if (err) {
                                                errorFlag = true;
                                                done(err);
                                            }
                                            ++backCount;
                                            if (backCount % 10 == 0)
                                                util.print(backCount + "..");
                                            if (backCount >= 108) {  // 108 Elements
                                                util.print("108\n");
                                                done();
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                })

            })

            describe("PutIfAbsent", function () {
                it("Simple putIfAbsent", function (done) {
                    var durability = new kvTypes.Durability( kvTypes.SyncPolicy.SYNC,
                        kvTypes.SyncPolicy.SYNC,
                        kvTypes.ReplicaAckPolicy.ALL);
                    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    store.putIfAbsent("t2", row, writeOptions, done);
                })
            })

            describe("PutIfPresent", function () {
                it("Simple putIfPresent", function (done) {
                    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    store.putIfPresent("t2", row, writeOptions, done);
                })
            })

            describe("PutIfVersion", function () {
                it("Simple putIfVersion", function (done) {
                    var consistency = new kvTypes.Consistency();
                    consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                    var readOptions = new kvTypes.ReadOptions(consistency);
                    var primaryKey = {id: 100};
                    store.get("t2", primaryKey, readOptions, function (err, response) {
                        if (typeof response !== "undefined") {
                            var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                            store.putIfVersion("t2", row, response.currentRowVersion, writeOptions, done);
                        } else {
                            done(err);
                        }
                    })
                })
            })

        });

});