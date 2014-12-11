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
        this.l = 999999999999999;  // max js long precision
        this.f = 9.123456;         //float
        this.d = 9.12345678901234; //double
        this.bool = true;
        this.bin = file64;
        this.fbin = fbin64;
        this.arrStr = ["X", "Y", "Z"];
        this.e = "A";
    }

    var durability =
        new kvTypes.Durability(kvTypes.SyncPolicy.SYNC,
            kvTypes.ReplicaAckPolicy.ALL,
            kvTypes.SyncPolicy.SYNC);

    var row = new Row();


    describe("Readable Streams", function () {
        var store = kvClient.createStore(configuration);
        var durability, writeOptions, row;
        before(function (done) {
            this.timeout(5000);
            store.open(function (err) {
                if (err) done(err); else {
                    durability =
                        new kvTypes.Durability(
                            kvTypes.SyncPolicy.SYNC,
                            kvTypes.ReplicaAckPolicy.ALL,
                            kvTypes.SyncPolicy.SYNC);
                    writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    util.print("    Preparing data for Streams: ")
                    for (var shardKey = 1; shardKey < 5; shardKey++) {
                        util.print((shardKey*20) + "..");
                        for (var id = 1; id < 30; id++) {
                            store.put("p1",
                                {shardKey: shardKey, id: id,
                                    s: "testing streams with shardKey: " + shardKey + "  id: " + id},
                                writeOptions, null);

                        }
                    }
                    util.print("100\n");
                    util.print("    Preparing data for Streams - indexes: ")
                    for (var shardKey = 1; shardKey < 4; shardKey++) {
                        util.print((shardKey*64) + "..");
                        for (var id = 1; id < 4; id++)
                            for (var indexKey1 = 1; indexKey1 < 4; indexKey1++)
                                for (var indexKey2 = 1; indexKey2 < 4; indexKey2++) {
                                    store.put("t3",
                                        {   shardKey: shardKey, id: id, indexKey1: indexKey1,
                                            s: "testing streams with shardKey-index: " + shardKey + "  id: " + id,
                                            indexKey2: "\"" + indexKey2 + "\""
                                        },
                                        writeOptions, null);
                                }
                    }
                    util.print("256\n");
                    //console.log("    Wait for data to be written...");
                    setTimeout(done, 1000);
                    //done();
                }
            });
        });

        describe("TableStream", function () {
            it("should get Readable Stream Items from next() SYNC mode from 6 to 24 - UNORDERED", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                var fieldRange = new kvTypes.FieldRange("id", "5", false, "25", false);
                store.tableStream(
                    "p1",
                    {shardKey: 1},
                    fieldRange,
                    null,
                    readOptions, kvTypes.Direction.UNORDERED,
                    function (err, stream) {
                        var total=0;
                        stream.on('data', function(data) {
                            total = total + data.length;
                        }).on('end', function() {
                            console.log("        " + total + " bytes received.");
                            done();
                        }).on('error', function(err) {
                            done(err);
                        });
                    }
                );
            });

        });

        describe("TableKeyStream", function () {
            it("simple call tableKeyStream() from 6 to 24", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                var fieldRange = new kvTypes.FieldRange("id", "5", false, "25", false);
                store.tableKeyStream(
                    "p1",
                    {shardKey: 1},
                    fieldRange,
                    null,
                    readOptions, kvTypes.Direction.UNORDERED,
                    function (err, stream) {
                        var total=0;
                        stream.on('data', function(data) {
                            total = total + data.length;
                        }).on('end', function() {
                            console.log("        " + total + " bytes received.");
                            done();
                        }).on('error', function(err) {
                            done(err);
                        });
                    }
                );
            });

        });  // describe TableKeyIterator

        describe("IndexStream", function () {
            it("simple call indexStream()", function (done) {
                this.timeout(2000);
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                store.indexStream(
                    "t2",
                    "t2_idx",
                    null,
                    null,
                    null,
                    readOptions, kvTypes.Direction.UNORDERED,
                    function (err, stream) {
                        var total=0;
                        stream.on('data', function(data) {
                            total = total + data.length;
                        }).on('end', function() {
                            console.log("        " + total + " bytes received.");
                            done();
                        }).on('error', function(err) {
                            done(err);
                        });
                    }
                );
            });

        });

        describe("IndexKeyStream", function () {
            it("simple call indexKeyStream()", function (done) {
                this.timeout(2000);
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                store.indexKeyStream (
                    "t2",
                    "t2_idx",
                    null,
                    null,
                    null,
                    readOptions, kvTypes.Direction.UNORDERED,
                    function (err, stream) {
                        var total=0;
                        stream.on('data', function(data) {
                            total = total + data.length;
                        }).on('end', function() {
                            console.log("        " + total + " bytes received.");
                            done();
                        }).on('error', function(err) {
                            done(err);
                        });
                    }
                );
            });

        });  // describe IndexIterator

    });

});
